<?php
/**
 * OpenClaw Personal Agent Console - Namecheap Production View (index.php)
 *
 * Fully integrated frontend matching the sleek dark design.
 * Stripped of all irrelevant placeholders and powered by real OpenClaw & Kaggle features.
 */

// ==========================================
// 1. DATA & WORKER STATE CONFIGURATION
// ==========================================

$user_name = "Operator";
$console_title = "OpenClaw Console";
$agent_name = "kaggle-strategist";
$model_name = "qwen3:14b-q4_K_M";
$worker_host = "Kaggle GPU Accelerator (T4/P100)";

// Check for live worker status file or default
$status_file = __DIR__ . '/data/worker_status.json';
$worker_status = [
    "status" => "Offline",
    "model" => $model_name,
    "agent" => $agent_name,
    "lastCheckIn" => null,
    "queuedCount" => 0,
    "serverTime" => date('c')
];

if (file_exists($status_file)) {
    $raw_status = @json_decode(file_get_contents($status_file), true);
    if (is_array($raw_status)) {
        $worker_status = array_merge($worker_status, $raw_status);
    }
}

// Relevant OpenClaw Agent Action Chips
$action_chips = [
    ["label" => "Run Kaggle Strategy", "prompt" => "Formulate an optimal strategy for the dataset and baseline model."],
    ["label" => "Generate Python Script", "prompt" => "Write a robust Python script for data preprocessing and evaluation."],
    ["label" => "Deep Analysis", "prompt" => "Perform a comprehensive reasoning breakdown and step-by-step analysis on: "],
    ["label" => "Debug Code Block", "prompt" => "Analyze and debug this Python code block, highlighting bottlenecks and errors:\n\n```python\n\n```"],
    ["label" => "Worker Diagnostics", "prompt" => "Test OpenClaw worker readiness and verify inference parameter integrity."]
];

// Check for existing conversations in data/conversations.json
$conversations_file = __DIR__ . '/data/conversations.json';
$previous_chats = [];

if (file_exists($conversations_file)) {
    $raw_chats = @json_decode(file_get_contents($conversations_file), true);
    if (is_array($raw_chats)) {
        $colors = ["#10B981", "#06B6D4", "#8B5CF6", "#EC4899"];
        $i = 0;
        foreach ($raw_chats as $id => $c) {
            $previous_chats[] = [
                "id" => $id,
                "title" => $c['title'] ?? 'Untitled Conversation',
                "tag_color" => $colors[$i % count($colors)],
                "dots" => 1,
                "date" => isset($c['updatedAt']) ? date('M j', strtotime($c['updatedAt'])) : 'Recent'
            ];
            $i++;
            if ($i >= 4) break;
        }
    }
}

// Fallback previous chats if fresh install
if (empty($previous_chats)) {
    $previous_chats = [
        ["id" => "c_1", "title" => "Formulate LightGBM baseline for tabular competition", "tag_color" => "#10B981", "dots" => 1, "date" => "Today"],
        ["id" => "c_2", "title" => "Feature engineering pipeline for time-series data", "tag_color" => "#06B6D4", "dots" => 2, "date" => "Yesterday"],
        ["id" => "c_3", "title" => "PyTorch GPU memory profiling and batch sizing", "tag_color" => "#8B5CF6", "dots" => 3, "date" => "Sep 14"],
        ["id" => "c_4", "title" => "Cross-validation leak check and metric calibration", "tag_color" => "#EC4899", "dots" => 1, "date" => "Sep 12"]
    ];
}

// 4-Column Infrastructure Cards
$infrastructure_cards = [
    [
        "id" => "kaggle_worker",
        "name" => "Kaggle Worker",
        "badge" => $worker_status['status'],
        "badge_status" => $worker_status['status'] === 'Agent Online' ? 'online' : 'offline',
        "icon_text" => "KG",
        "icon_bg" => "#06B6D4",
        "description" => $model_name . " hosted on Kaggle GPU accelerator running Ollama."
    ],
    [
        "id" => "request_queue",
        "name" => "Request Queue",
        "badge" => ($worker_status['queuedCount'] ?? 0) . " queued",
        "badge_status" => "neutral",
        "icon_text" => "Q",
        "icon_bg" => "#F59E0B",
        "description" => "Asynchronous 5-second polling queue. Preserves requests while offline."
    ],
    [
        "id" => "namecheap_api",
        "name" => "Namecheap PHP API",
        "badge" => "Active",
        "badge_status" => "online",
        "icon_text" => "PHP",
        "icon_bg" => "#10B981",
        "description" => "Lightweight cPanel-compatible JSON store broker (api.php)."
    ],
    [
        "id" => "mobile_pwa",
        "name" => "Installable PWA",
        "badge" => "Ready",
        "badge_status" => "neutral",
        "icon_text" => "PWA",
        "icon_bg" => "#6366F1",
        "description" => "Install directly to iOS / Android home screen for full-screen console."
    ]
];

// Handle direct prompt submission
$submission_feedback = null;
if ($_SERVER['REQUEST_METHOD'] === 'POST' && !empty($_POST['prompt'])) {
    $prompt = trim($_POST['prompt']);
    $queue_file = __DIR__ . '/data/request_queue.json';
    $queue = file_exists($queue_file) ? @json_decode(file_get_contents($queue_file), true) : [];
    if (!is_array($queue)) $queue = [];

    $new_id = 'req_' . bin2hex(random_bytes(6));
    $queue[] = [
        "id" => $new_id,
        "prompt" => $prompt,
        "model" => $model_name,
        "agent" => $agent_name,
        "queuedAt" => date('c'),
        "status" => "pending"
    ];

    if (!is_dir(__DIR__ . '/data')) {
        @mkdir(__DIR__ . '/data', 0775, true);
    }
    @file_put_contents($queue_file, json_encode($queue, JSON_PRETTY_PRINT));
    $submission_feedback = "Prompt queued for OpenClaw (ID: " . htmlspecialchars($new_id) . ")";
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OpenClaw Console - <?php echo htmlspecialchars($agent_name); ?></title>
    <link rel="manifest" href="manifest.json">
    <meta name="theme-color" content="#0B0B0C">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        *, *::before, *::after {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        :root {
            --bg-canvas: #0B0B0C;
            --bg-surface: #121214;
            --bg-surface-hover: #18181B;
            --border-subtle: #1F1F23;
            --border-hover: #2E2E35;
            --text-primary: #EDEDED;
            --text-secondary: #A1A1AA;
            --text-muted: #71717A;
            --emerald: #10B981;
            --amber: #F59E0B;
            --sky: #06B6D4;
            --purple: #8B5CF6;
            --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            --font-serif: "Georgia", "Cambria", "Times New Roman", Times, serif;
            --sidebar-width: 240px;
        }

        body {
            background-color: var(--bg-canvas);
            color: var(--text-primary);
            font-family: var(--font-sans);
            font-size: 13px;
            line-height: 1.5;
            min-height: 100vh;
            display: flex;
            overflow: hidden;
            -webkit-font-smoothing: antialiased;
        }

        .app-layout {
            display: flex;
            width: 100vw;
            height: 100vh;
            overflow: hidden;
        }

        /* 1. LEFT SIDEBAR (240px) */
        .sidebar {
            width: var(--sidebar-width);
            min-width: var(--sidebar-width);
            background-color: var(--bg-surface);
            border-right: 1px solid var(--border-subtle);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            height: 100%;
            user-select: none;
        }

        .sidebar-top {
            padding: 12px;
            overflow-y: auto;
            flex: 1;
        }

        .brand-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 6px 8px;
            margin-bottom: 12px;
        }

        .brand-info {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .brand-icon {
            width: 20px;
            height: 20px;
            border-radius: 6px;
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid rgba(16, 185, 129, 0.3);
            color: var(--emerald);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: 700;
            font-family: monospace;
        }

        .brand-name {
            font-size: 12px;
            font-weight: 600;
            color: var(--text-primary);
            line-height: 1.2;
        }

        .status-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: var(--emerald);
        }
        .status-dot.offline { background: var(--text-muted); }
        .status-dot.starting { background: var(--amber); }

        .btn-new-chat {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 7px 12px;
            border-radius: 8px;
            background: var(--emerald);
            color: #FFF;
            font-size: 12px;
            font-weight: 500;
            text-decoration: none;
            border: none;
            cursor: pointer;
            margin-bottom: 14px;
            transition: opacity 0.15s ease;
        }
        .btn-new-chat:hover { opacity: 0.9; }

        .nav-list {
            list-style: none;
            display: flex;
            flex-direction: column;
            gap: 2px;
            margin-bottom: 16px;
        }

        .nav-item a {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 6px 8px;
            border-radius: 6px;
            color: var(--text-secondary);
            text-decoration: none;
            font-size: 12px;
            transition: all 0.15s ease;
        }

        .nav-item a:hover {
            color: var(--text-primary);
            background: var(--bg-surface-hover);
        }

        .nav-item.active a {
            background: rgba(255, 255, 255, 0.08);
            color: var(--text-primary);
            font-weight: 500;
        }

        .nav-item-content {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .sidebar-section-title {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--text-muted);
            font-weight: 600;
            padding: 6px 8px 4px;
        }

        .history-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 6px 8px;
            border-radius: 6px;
            color: var(--text-secondary);
            text-decoration: none;
            font-size: 11.5px;
            transition: all 0.15s ease;
        }
        .history-item:hover {
            background: var(--bg-surface-hover);
            color: var(--text-primary);
        }

        .sidebar-status-card {
            margin: 8px 12px;
            padding: 8px 10px;
            border-radius: 8px;
            background: var(--bg-canvas);
            border: 1px solid var(--border-subtle);
            font-size: 11px;
        }
        .status-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 4px;
        }

        .sidebar-bottom {
            padding: 10px 12px;
            border-top: 1px solid var(--border-subtle);
            background: var(--bg-surface);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .user-profile {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .user-badge {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: rgba(16, 185, 129, 0.15);
            border: 1px solid rgba(16, 185, 129, 0.3);
            color: var(--emerald);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: 700;
            font-family: monospace;
        }

        /* 2. MAIN CONTAINER */
        .main-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            background-color: var(--bg-canvas);
        }

        .top-header {
            height: 48px;
            min-height: 48px;
            border-bottom: 1px solid var(--border-subtle);
            padding: 0 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: rgba(11, 11, 12, 0.9);
            backdrop-filter: blur(8px);
            position: sticky;
            top: 0;
            z-index: 10;
        }

        .agent-capsules {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .agent-capsule {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 3px 10px;
            border-radius: 20px;
            font-size: 11.5px;
            text-decoration: none;
            color: var(--text-muted);
            border: 1px solid transparent;
            transition: all 0.15s ease;
        }

        .agent-capsule.active {
            background: #18181B;
            border-color: #27272A;
            color: var(--text-primary);
            font-weight: 500;
        }

        .header-actions {
            display: flex;
            align-items: center;
            gap: 14px;
            font-size: 12px;
            color: var(--text-secondary);
        }

        .header-actions a {
            color: var(--text-secondary);
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 4px;
        }
        .header-actions a:hover { color: var(--text-primary); }

        .content-scroll {
            flex: 1;
            overflow-y: auto;
            padding: 40px 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .dashboard-content {
            width: 100%;
            max-width: 840px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .greeting-section {
            text-align: center;
            margin-bottom: 28px;
        }

        .greeting-title {
            font-family: var(--font-serif);
            font-size: 42px;
            font-weight: 400;
            color: #FFF;
            letter-spacing: -0.5px;
            margin-bottom: 6px;
        }

        .greeting-subtitle {
            font-size: 12px;
            color: var(--text-muted);
            font-family: monospace;
        }

        /* PROMPT TERMINAL BOX */
        .prompt-card {
            width: 100%;
            background: var(--bg-surface);
            border: 1px solid var(--border-subtle);
            border-radius: 16px;
            padding: 16px;
            margin-bottom: 16px;
            box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.7);
            transition: border-color 0.15s ease;
        }
        .prompt-card:focus-within {
            border-color: var(--border-hover);
        }

        .prompt-textarea {
            width: 100%;
            background: transparent;
            border: none;
            outline: none;
            resize: none;
            font-family: inherit;
            font-size: 14px;
            color: var(--text-primary);
            line-height: 1.5;
            min-height: 58px;
        }

        .prompt-toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-top: 10px;
            margin-top: 4px;
            border-top: 1px solid rgba(31, 31, 35, 0.6);
        }

        .toolbar-left {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 11px;
            color: var(--text-secondary);
        }

        .pill-badge {
            padding: 2px 8px;
            border-radius: 20px;
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.04);
            display: inline-flex;
            align-items: center;
            gap: 5px;
        }

        .submit-btn {
            padding: 6px 14px;
            border-radius: 8px;
            background: var(--emerald);
            border: none;
            color: #FFF;
            font-weight: 500;
            font-size: 12px;
            cursor: pointer;
            transition: opacity 0.15s ease;
        }
        .submit-btn:hover { opacity: 0.9; }

        /* ACTION CHIPS */
        .chips-container {
            display: flex;
            align-items: center;
            justify-content: center;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 40px;
        }

        .chip {
            padding: 6px 14px;
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid var(--border-subtle);
            border-radius: 20px;
            font-size: 12px;
            color: var(--text-secondary);
            cursor: pointer;
            transition: all 0.15s ease;
        }
        .chip:hover {
            background: var(--bg-surface-hover);
            border-color: var(--border-hover);
            color: var(--text-primary);
        }

        /* 4-COLUMN MATRIX GRIDS */
        .section-matrix {
            width: 100%;
            margin-bottom: 34px;
        }

        .section-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
        }

        .section-title {
            font-size: 12px;
            font-weight: 500;
            color: var(--text-muted);
        }

        .grid-4 {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            width: 100%;
        }

        .chat-card {
            background: var(--bg-surface);
            border: 1px solid var(--border-subtle);
            border-radius: 12px;
            padding: 14px 12px;
            text-decoration: none;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            min-height: 90px;
            transition: all 0.15s ease;
        }
        .chat-card:hover {
            background: var(--bg-surface-hover);
            border-color: var(--border-hover);
        }

        .chat-card-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 6px;
        }

        .chat-card-text {
            font-size: 12px;
            color: var(--text-secondary);
            line-height: 1.4;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            font-weight: 500;
        }

        .infra-card {
            background: var(--bg-surface);
            border: 1px solid var(--border-subtle);
            border-radius: 12px;
            padding: 14px 12px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            min-height: 114px;
            transition: all 0.15s ease;
        }
        .infra-card:hover {
            border-color: var(--border-hover);
        }

        .infra-card-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 8px;
        }

        .infra-title-wrap {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .infra-icon {
            width: 20px;
            height: 20px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: 700;
            color: #FFF;
        }

        .infra-badge {
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 4px;
            border: 1px solid var(--border-subtle);
            color: var(--text-secondary);
        }
        .infra-badge.online {
            background: rgba(16, 185, 129, 0.1);
            color: var(--emerald);
            border-color: rgba(16, 185, 129, 0.2);
        }

        .infra-desc {
            font-size: 11px;
            color: var(--text-muted);
            line-height: 1.4;
        }

        @media (max-width: 1024px) {
            .grid-4 { grid-template-columns: repeat(2, 1fr); }
        }

        @media (max-width: 768px) {
            .sidebar { display: none; }
            .grid-4 { grid-template-columns: 1fr; }
            .greeting-title { font-size: 32px; }
        }
    </style>
</head>
<body>

<div class="app-layout">
    <!-- 1. LEFT SIDEBAR (240px) -->
    <aside class="sidebar">
        <div class="sidebar-top">
            <div class="brand-header">
                <div class="brand-info">
                    <div class="brand-icon">OC</div>
                    <div>
                        <h2 class="brand-name">OpenClaw</h2>
                        <span style="font-size: 10px; color: var(--text-muted); font-family: monospace;">kaggle-strategist</span>
                    </div>
                </div>
                <span class="status-dot <?php echo $worker_status['status'] === 'Agent Online' ? '' : ($worker_status['status'] === 'Starting' ? 'starting' : 'offline'); ?>"></span>
            </div>

            <a href="?action=new_chat" class="btn-new-chat">+ New Conversation</a>

            <ul class="nav-list">
                <li class="nav-item active"><a href="index.php"><div class="nav-item-content"><span>Console Home</span></div></a></li>
                <li class="nav-item"><a href="?screen=chat"><div class="nav-item-content"><span>Active Chat</span></div></a></li>
                <li class="nav-item"><a href="?screen=history"><div class="nav-item-content"><span>All Conversations</span></div></a></li>
                <li class="nav-item"><a href="?screen=status"><div class="nav-item-content"><span>Kaggle Telemetry</span></div><span style="font-size: 10px; color: var(--sky); font-family: monospace;"><?php echo $worker_status['queuedCount']; ?></span></a></li>
            </ul>

            <div class="sidebar-section-title">Recent History</div>
            <?php foreach ($previous_chats as $chat): ?>
                <a href="?chat_id=<?php echo urlencode($chat['id']); ?>" class="history-item">
                    <span class="status-dot" style="background-color: <?php echo htmlspecialchars($chat['tag_color']); ?>;"></span>
                    <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"><?php echo htmlspecialchars($chat['title']); ?></span>
                </a>
            <?php endforeach; ?>
        </div>

        <div class="sidebar-status-card">
            <div class="status-header">
                <span style="font-weight: 500; color: var(--text-primary);">Kaggle Worker</span>
                <span style="color: <?php echo $worker_status['status'] === 'Agent Online' ? 'var(--emerald)' : 'var(--amber)'; ?>; font-family: monospace; font-size: 10px;"><?php echo htmlspecialchars($worker_status['status']); ?></span>
            </div>
            <div style="color: var(--text-muted); font-size: 10px; font-family: monospace;">qwen3:14b-q4_K_M</div>
        </div>

        <div class="sidebar-bottom">
            <div class="user-profile">
                <div class="user-badge">OP</div>
                <div>
                    <div style="font-size: 11px; font-weight: 500; color: var(--text-primary);">Private Account</div>
                    <div style="font-size: 10px; color: var(--text-muted); font-family: monospace;">Owner</div>
                </div>
            </div>
            <a href="?action=logout" style="color: var(--text-muted); text-decoration: none; font-size: 11px;">Exit</a>
        </div>
    </aside>

    <!-- 2. MAIN CONTAINER -->
    <main class="main-container">
        <header class="top-header">
            <div class="agent-capsules">
                <div class="agent-capsule active">
                    <span class="status-dot"></span>
                    <span>kaggle-strategist</span>
                </div>
                <div class="agent-capsule" style="font-family: monospace; font-size: 11px; color: var(--sky); background: rgba(6, 182, 212, 0.08); border-color: rgba(6, 182, 212, 0.2);">
                    <span>qwen3:14b-q4_K_M</span>
                </div>
                <div class="agent-capsule" style="font-size: 11px;">
                    <span>Worker: <?php echo htmlspecialchars($worker_status['status']); ?></span>
                </div>
            </div>

            <div class="header-actions">
                <a href="?action=new_chat">+ New Chat</a>
                <a href="?screen=status">Telemetry</a>
                <a href="?screen=settings">Settings</a>
            </div>
        </header>

        <div class="content-scroll">
            <div class="dashboard-content">

                <!-- Greeting -->
                <div class="greeting-section">
                    <h1 class="greeting-title">Good morning, <?php echo htmlspecialchars($user_name); ?></h1>
                    <p class="greeting-subtitle">OpenClaw Agent <?php echo htmlspecialchars($agent_name); ?> • Model <?php echo htmlspecialchars($model_name); ?></p>
                </div>

                <?php if ($submission_feedback): ?>
                    <div style="width: 100%; padding: 10px 14px; margin-bottom: 16px; border-radius: 8px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); color: var(--emerald); font-size: 12px;">
                        <?php echo htmlspecialchars($submission_feedback); ?>
                    </div>
                <?php endif; ?>

                <!-- Prompt Form Terminal -->
                <form method="POST" action="" class="prompt-card">
                    <textarea 
                        name="prompt" 
                        class="prompt-textarea" 
                        rows="2" 
                        placeholder="Send instruction to OpenClaw (qwen3:14b-q4_K_M)..."
                        required
                    ></textarea>

                    <div class="prompt-toolbar">
                        <div class="toolbar-left">
                            <span class="pill-badge">
                                <span class="status-dot"></span>
                                <span>Kaggle T4/P100</span>
                            </span>
                            <span class="pill-badge">
                                <span>14B Parameters</span>
                            </span>
                        </div>

                        <button type="submit" class="submit-btn">Execute &rarr;</button>
                    </div>
                </form>

                <!-- Action Chips -->
                <div class="chips-container">
                    <?php foreach ($action_chips as $chip): ?>
                        <button type="button" class="chip" onclick="document.querySelector('.prompt-textarea').value = '<?php echo addslashes($chip['prompt']); ?>'; document.querySelector('.prompt-textarea').focus();">
                            <span><?php echo htmlspecialchars($chip['label']); ?></span>
                        </button>
                    <?php endforeach; ?>
                </div>

                <!-- Previous Chats Matrix Grid -->
                <section class="section-matrix">
                    <div class="section-header">
                        <span class="section-title">Previous chats (<?php echo count($previous_chats); ?>)</span>
                        <a href="?screen=history" style="font-size: 11px; color: var(--text-muted); text-decoration: none;">View All &rarr;</a>
                    </div>

                    <div class="grid-4">
                        <?php foreach ($previous_chats as $chat): ?>
                            <a href="?chat_id=<?php echo urlencode($chat['id']); ?>" class="chat-card">
                                <div class="chat-card-top">
                                    <span class="status-dot" style="background-color: <?php echo htmlspecialchars($chat['tag_color']); ?>;"></span>
                                    <span style="font-size: 10px; color: var(--text-muted); font-family: monospace;"><?php echo htmlspecialchars($chat['date']); ?></span>
                                </div>
                                <p class="chat-card-text"><?php echo htmlspecialchars($chat['title']); ?></p>
                            </a>
                        <?php endforeach; ?>
                    </div>
                </section>

                <!-- Infrastructure Cards -->
                <section class="section-matrix">
                    <div class="section-header">
                        <span class="section-title">Console Infrastructure & Telemetry</span>
                        <a href="?screen=status" style="font-size: 11px; color: var(--text-muted); text-decoration: none;">System Status &rarr;</a>
                    </div>

                    <div class="grid-4">
                        <?php foreach ($infrastructure_cards as $infra): ?>
                            <div class="infra-card">
                                <div>
                                    <div class="infra-card-top">
                                        <div class="infra-title-wrap">
                                            <div class="infra-icon" style="background-color: <?php echo htmlspecialchars($infra['icon_bg']); ?>;">
                                                <?php echo htmlspecialchars($infra['icon_text']); ?>
                                            </div>
                                            <span style="font-size: 12px; font-weight: 500; color: var(--text-primary);"><?php echo htmlspecialchars($infra['name']); ?></span>
                                        </div>
                                        <span class="infra-badge <?php echo $infra['badge_status']; ?>"><?php echo htmlspecialchars($infra['badge']); ?></span>
                                    </div>
                                    <p class="infra-desc"><?php echo htmlspecialchars($infra['description']); ?></p>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </section>

            </div>
        </div>
    </main>
</div>

</body>
</html>
