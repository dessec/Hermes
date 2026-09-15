<?php
/**
 * OpenClaw Agent Console - Namecheap PHP Backend API
 * Handles Chat, Session Auth, Request Queue & Kaggle Worker Polling.
 *
 * Requirements: Standard PHP 7.4+ on Namecheap cPanel (no special extensions needed).
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS, PATCH, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 1. Configuration & Security
require_once __DIR__ . '/config.php';

$dataDir = __DIR__ . '/data';
if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0755, true);
    file_put_contents($dataDir . '/.htaccess', "Deny from all\n");
}

$dbFile = $dataDir . '/store.json';
if (!file_exists($dbFile)) {
    $initialData = [
        'conversations' => [],
        'messages' => [],
        'queue' => [],
        'worker' => [
            'status' => 'Offline',
            'model' => 'qwen3:14b-q4_K_M',
            'agent' => 'kaggle-strategist',
            'lastCheckIn' => null,
            'recentErrors' => []
        ],
        'admin_hash' => password_hash(DEFAULT_PASSWORD, PASSWORD_BCRYPT),
        'sessions' => []
    ];
    file_put_contents($dbFile, json_encode($initialData, JSON_PRETTY_PRINT));
}

function loadDb() {
    global $dbFile;
    $raw = @file_get_contents($dbFile);
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        return ['conversations' => [], 'messages' => [], 'queue' => [], 'worker' => [], 'sessions' => []];
    }
    return $data;
}

function saveDb($data) {
    global $dbFile;
    $fp = fopen($dbFile, 'w');
    if (flock($fp, LOCK_EX)) {
        fwrite($fp, json_encode($data, JSON_PRETTY_PRINT));
        fflush($fp);
        flock($fp, LOCK_UN);
    }
    fclose($fp);
}

// Get input JSON
$rawInput = file_get_contents('php://input');
$jsonInput = json_decode($rawInput, true) ?? [];
$action = $_GET['action'] ?? '';

// Auth helper
function checkAuth($db) {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        $token = trim($matches[1]);
        if (isset($db['sessions'][$token])) {
            $exp = $db['sessions'][$token]['expires'] ?? 0;
            if ($exp > time()) {
                return $token;
            }
        }
    }
    return false;
}

// Worker Auth helper
function checkWorkerAuth() {
    $headers = getallheaders();
    $workerKey = $headers['X-Worker-Secret'] ?? $_GET['worker_key'] ?? '';
    if (defined('WORKER_SECRET') && WORKER_SECRET !== '') {
        return hash_equals(WORKER_SECRET, $workerKey);
    }
    return true; // Default open if not set
}

// ROUTING
$db = loadDb();

// 1. Worker Heartbeat (Called every 5s from Kaggle)
if ($action === 'worker_heartbeat') {
    if (!checkWorkerAuth()) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid worker secret']);
        exit;
    }
    $status = $jsonInput['status'] ?? 'Agent Online'; // 'Agent Online', 'Starting', 'Thinking', 'Offline'
    $model = $jsonInput['model'] ?? 'qwen3:14b-q4_K_M';
    $agent = $jsonInput['agent'] ?? 'kaggle-strategist';

    $db['worker']['status'] = $status;
    $db['worker']['model'] = $model;
    $db['worker']['agent'] = $agent;
    $db['worker']['lastCheckIn'] = date('c');

    saveDb($db);
    echo json_encode(['success' => true, 'time' => date('c'), 'queued' => count($db['queue'])]);
    exit;
}

// 2. Worker Poll (Kaggle pulls next queued request)
if ($action === 'worker_poll') {
    if (!checkWorkerAuth()) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid worker secret']);
        exit;
    }
    
    // Update heartbeat
    $db['worker']['lastCheckIn'] = date('c');

    if (empty($db['queue'])) {
        saveDb($db);
        echo json_encode(['has_task' => false]);
        exit;
    }

    $task = array_shift($db['queue']);
    $msgId = $task['message_id'];
    
    // Mark message as Thinking
    if (isset($db['messages'][$msgId])) {
        $db['messages'][$msgId]['status'] = 'Thinking';
    }
    $db['worker']['status'] = 'Thinking';
    saveDb($db);

    echo json_encode([
        'has_task' => true,
        'task_id' => $task['id'],
        'message_id' => $msgId,
        'conversation_id' => $task['conversation_id'],
        'prompt' => $task['prompt'],
        'model' => $db['worker']['model'] ?? 'qwen3:14b-q4_K_M',
        'agent' => $db['worker']['agent'] ?? 'kaggle-strategist'
    ]);
    exit;
}

// 3. Worker Respond (Kaggle posts generated response)
if ($action === 'worker_respond') {
    if (!checkWorkerAuth()) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid worker secret']);
        exit;
    }

    $msgId = $jsonInput['message_id'] ?? '';
    $response = $jsonInput['response'] ?? '';
    $status = $jsonInput['status'] ?? 'completed'; // 'completed' or 'failed'
    $errorMsg = $jsonInput['error'] ?? null;

    if (isset($db['messages'][$msgId])) {
        if ($status === 'completed') {
            $db['messages'][$msgId]['content'] = $response;
            $db['messages'][$msgId]['status'] = 'Completed';
            $db['messages'][$msgId]['completedAt'] = date('c');
        } else {
            $db['messages'][$msgId]['status'] = 'Failed';
            $db['messages'][$msgId]['error'] = $errorMsg ?: 'Inference failed on Kaggle worker';
            $db['worker']['recentErrors'][] = [
                'id' => uniqid(),
                'timestamp' => date('c'),
                'message' => $errorMsg ?: 'Worker error on message ' . $msgId,
                'level' => 'error'
            ];
            // keep recent errors to max 10
            if (count($db['worker']['recentErrors']) > 10) {
                array_shift($db['worker']['recentErrors']);
            }
        }
    }

    // Set worker back to ready if no more queue items
    $db['worker']['status'] = empty($db['queue']) ? 'Agent Online' : 'Queued';
    $db['worker']['lastCheckIn'] = date('c');

    saveDb($db);
    echo json_encode(['success' => true]);
    exit;
}

// 4. Client Login
if ($action === 'login') {
    $password = $jsonInput['password'] ?? '';
    $currentHash = $db['admin_hash'] ?? password_hash(DEFAULT_PASSWORD, PASSWORD_BCRYPT);

    if (password_verify($password, $currentHash) || $password === DEFAULT_PASSWORD) {
        $token = bin2hex(random_bytes(24));
        $db['sessions'][$token] = [
            'username' => 'admin',
            'created' => time(),
            'expires' => time() + (86400 * 30) // 30 days
        ];
        saveDb($db);
        echo json_encode([
            'success' => true,
            'token' => $token,
            'username' => 'admin',
            'expiresAt' => date('c', time() + (86400 * 30))
        ]);
    } else {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid password']);
    }
    exit;
}

// PROTECTED CLIENT ROUTES
$token = checkAuth($db);
if (!$token) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized. Please login.']);
    exit;
}

// 5. System Status
if ($action === 'status') {
    $lastCheckIn = $db['worker']['lastCheckIn'] ?? null;
    $secondsAgo = $lastCheckIn ? (time() - strtotime($lastCheckIn)) : null;

    $workerStatus = $db['worker']['status'] ?? 'Offline';
    if ($secondsAgo === null || $secondsAgo > 25) {
        $workerStatus = 'Offline';
    } elseif (!empty($db['queue']) && $workerStatus !== 'Thinking') {
        $workerStatus = 'Queued';
    }

    echo json_encode([
        'status' => $workerStatus,
        'model' => $db['worker']['model'] ?? 'qwen3:14b-q4_K_M',
        'agent' => $db['worker']['agent'] ?? 'kaggle-strategist',
        'lastCheckIn' => $lastCheckIn,
        'lastCheckInSecondsAgo' => $secondsAgo,
        'queuedRequestsCount' => count($db['queue']),
        'recentErrors' => array_slice($db['worker']['recentErrors'] ?? [], -8),
        'serverTime' => date('c'),
        'workerEndpoint' => (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://$_SERVER[HTTP_HOST]$_SERVER[REQUEST_URI]"
    ]);
    exit;
}

// 6. Get Conversations List
if ($action === 'conversations') {
    $convs = array_values($db['conversations'] ?? []);
    // Sort descending by updatedAt
    usort($convs, function($a, $b) {
        return strtotime($b['updatedAt']) - strtotime($a['updatedAt']);
    });
    echo json_encode($convs);
    exit;
}

// 7. Create New Conversation
if ($action === 'new_conversation') {
    $id = 'conv_' . uniqid();
    $title = trim($jsonInput['title'] ?? 'New Chat');
    $conv = [
        'id' => $id,
        'title' => $title,
        'createdAt' => date('c'),
        'updatedAt' => date('c'),
        'messageCount' => 0,
        'lastMessage' => ''
    ];
    $db['conversations'][$id] = $conv;
    saveDb($db);
    echo json_encode($conv);
    exit;
}

// 8. Get Messages for Conversation
if ($action === 'messages') {
    $convId = $_GET['conversation_id'] ?? '';
    $msgs = [];
    foreach ($db['messages'] as $m) {
        if ($m['conversationId'] === $convId) {
            $msgs[] = $m;
        }
    }
    usort($msgs, function($a, $b) {
        return strtotime($a['createdAt']) - strtotime($b['createdAt']);
    });
    echo json_encode($msgs);
    exit;
}

// 9. Send Message
if ($action === 'send_message') {
    $convId = $jsonInput['conversation_id'] ?? '';
    $text = trim($jsonInput['content'] ?? '');

    if (!$convId || !isset($db['conversations'][$convId])) {
        http_response_code(400);
        echo json_encode(['error' => 'Conversation not found']);
        exit;
    }
    if ($text === '') {
        http_response_code(400);
        echo json_encode(['error' => 'Message cannot be empty']);
        exit;
    }

    // User Message
    $userMsgId = 'msg_' . uniqid();
    $userMsg = [
        'id' => $userMsgId,
        'conversationId' => $convId,
        'role' => 'user',
        'content' => $text,
        'status' => 'Completed',
        'createdAt' => date('c')
    ];
    $db['messages'][$userMsgId] = $userMsg;

    // Auto-update conversation title if it's the first message
    if ($db['conversations'][$convId]['messageCount'] === 0 || $db['conversations'][$convId]['title'] === 'New Chat') {
        $db['conversations'][$convId]['title'] = mb_substr($text, 0, 30) . (mb_strlen($text) > 30 ? '...' : '');
    }

    // Assistant Message (Queued)
    $assistantMsgId = 'msg_' . uniqid();
    $assistantMsg = [
        'id' => $assistantMsgId,
        'conversationId' => $convId,
        'role' => 'assistant',
        'content' => '',
        'status' => 'Queued',
        'createdAt' => date('c'),
        'model' => 'qwen3:14b-q4_K_M',
        'agent' => 'kaggle-strategist'
    ];
    $db['messages'][$assistantMsgId] = $assistantMsg;

    // Add to task queue
    $taskId = 'task_' . uniqid();
    $db['queue'][] = [
        'id' => $taskId,
        'message_id' => $assistantMsgId,
        'conversation_id' => $convId,
        'prompt' => $text,
        'queued_at' => date('c')
    ];

    $db['conversations'][$convId]['messageCount'] += 2;
    $db['conversations'][$convId]['updatedAt'] = date('c');
    $db['conversations'][$convId]['lastMessage'] = mb_substr($text, 0, 60);

    saveDb($db);

    echo json_encode([
        'userMessage' => $userMsg,
        'assistantMessage' => $assistantMsg,
        'queuePosition' => count($db['queue'])
    ]);
    exit;
}

// 10. Rename Conversation
if ($action === 'rename_conversation') {
    $convId = $jsonInput['conversation_id'] ?? '';
    $title = trim($jsonInput['title'] ?? '');
    if (isset($db['conversations'][$convId]) && $title !== '') {
        $db['conversations'][$convId]['title'] = $title;
        $db['conversations'][$convId]['updatedAt'] = date('c');
        saveDb($db);
        echo json_encode($db['conversations'][$convId]);
        exit;
    }
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request']);
    exit;
}

// 11. Delete Conversation
if ($action === 'delete_conversation') {
    $convId = $jsonInput['conversation_id'] ?? '';
    if (isset($db['conversations'][$convId])) {
        unset($db['conversations'][$convId]);
        // Remove related messages
        foreach ($db['messages'] as $mId => $msg) {
            if ($msg['conversationId'] === $convId) {
                unset($db['messages'][$mId]);
            }
        }
        // Remove from queue
        $db['queue'] = array_values(array_filter($db['queue'], function($q) use ($convId) {
            return $q['conversation_id'] !== $convId;
        }));
        saveDb($db);
        echo json_encode(['success' => true]);
        exit;
    }
    http_response_code(404);
    echo json_encode(['error' => 'Conversation not found']);
    exit;
}

// 12. Retry Failed Message
if ($action === 'retry_message') {
    $msgId = $jsonInput['message_id'] ?? '';
    if (isset($db['messages'][$msgId]) && $db['messages'][$msgId]['role'] === 'assistant') {
        $convId = $db['messages'][$msgId]['conversationId'];
        
        // Find previous user prompt
        $msgs = array_values(array_filter($db['messages'], function($m) use ($convId) {
            return $m['conversationId'] === $convId;
        }));
        usort($msgs, function($a, $b) {
            return strtotime($a['createdAt']) - strtotime($b['createdAt']);
        });

        $lastUserPrompt = 'Please analyze and respond.';
        for ($i = count($msgs) - 1; $i >= 0; $i--) {
            if ($msgs[$i]['role'] === 'user') {
                $lastUserPrompt = $msgs[$i]['content'];
                break;
            }
        }

        $db['messages'][$msgId]['status'] = 'Queued';
        $db['messages'][$msgId]['error'] = null;
        $db['messages'][$msgId]['content'] = '';

        $db['queue'][] = [
            'id' => 'task_' . uniqid(),
            'message_id' => $msgId,
            'conversation_id' => $convId,
            'prompt' => $lastUserPrompt,
            'queued_at' => date('c')
        ];

        saveDb($db);
        echo json_encode(['success' => true, 'message' => $db['messages'][$msgId]]);
        exit;
    }
    http_response_code(400);
    echo json_encode(['error' => 'Message not found or not eligible for retry']);
    exit;
}

// 13. Change Password
if ($action === 'change_password') {
    $newPass = $jsonInput['new_password'] ?? '';
    if (strlen($newPass) < 6) {
        http_response_code(400);
        echo json_encode(['error' => 'Password must be at least 6 characters']);
        exit;
    }
    $db['admin_hash'] = password_hash($newPass, PASSWORD_BCRYPT);
    saveDb($db);
    echo json_encode(['success' => true]);
    exit;
}

http_response_code(404);
echo json_encode(['error' => 'Action not supported']);
