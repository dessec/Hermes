import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { backendAdapter } from "./server/backendAdapter";

interface Message {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  status: "Queued" | "Thinking" | "Completed" | "Failed";
  createdAt: string;
  completedAt?: string;
  model?: string;
  agent?: string;
  error?: string;
}

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastMessage?: string;
  messageCount: number;
}

interface QueueItem {
  id: string;
  messageId: string;
  conversationId: string;
  prompt: string;
  queuedAt: string;
  status: "pending" | "processing";
}

interface ErrorLog {
  id: string;
  timestamp: string;
  message: string;
  level: "info" | "warn" | "error";
}

// In-memory data store with portable file persistence
const DATA_FILE = process.env.DATA_FILE_PATH || path.join(process.cwd(), "openclaw_store.json");

let masterPassword = process.env.OPENCLAW_PASSWORD || "openclaw2025";
const workerSecretToken = process.env.WORKER_SECRET_TOKEN || "";
const defaultModel = process.env.DEFAULT_MODEL || "qwen3:14b-q4_K_M";
const defaultAgent = process.env.DEFAULT_AGENT || "kaggle-strategist";

let activeSessions: Record<string, { username: string; expiresAt: number }> = {};
let conversations: Record<string, Conversation> = {};
let messages: Record<string, Message> = {};
let requestQueue: QueueItem[] = [];
let recentLogs: ErrorLog[] = [
  {
    id: "log_init",
    timestamp: new Date().toISOString(),
    message: "OpenClaw personal console initialized. Ready for worker connection.",
    level: "info",
  },
];

// Kaggle Worker state
let workerState = {
  status: "Agent Online" as "Agent Online" | "Starting" | "Offline" | "Queued" | "Thinking" | "Failed",
  model: defaultModel,
  agent: defaultAgent,
  lastCheckIn: new Date().toISOString(),
  isSimulatedWorker: true, // Enabled by default so user can test immediately before launching Kaggle
};

// Load saved data if exists
try {
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed.conversations) conversations = parsed.conversations;
    if (parsed.messages) messages = parsed.messages;
    if (parsed.masterPassword) masterPassword = parsed.masterPassword;
    if (parsed.workerState) {
      workerState.model = parsed.workerState.model || "qwen3:14b-q4_K_M";
      workerState.agent = parsed.workerState.agent || "kaggle-strategist";
      workerState.isSimulatedWorker = parsed.workerState.isSimulatedWorker ?? true;
    }
  }
} catch (e) {
  console.warn("Failed to read openclaw_store.json:", e);
}

// Seed default welcome conversation if empty
if (Object.keys(conversations).length === 0) {
  const defaultConvId = "conv_welcome";
  const now = new Date().toISOString();
  conversations[defaultConvId] = {
    id: defaultConvId,
    title: "Welcome to OpenClaw",
    createdAt: now,
    updatedAt: now,
    lastMessage: "OpenClaw agent console is ready.",
    messageCount: 2,
  };

  const userMsgId = "msg_welc_u";
  const astMsgId = "msg_welc_a";

  messages[userMsgId] = {
    id: userMsgId,
    conversationId: defaultConvId,
    role: "user",
    content: "Initialize system check and status of Kaggle worker.",
    status: "Completed",
    createdAt: new Date(Date.now() - 30000).toISOString(),
  };

  messages[astMsgId] = {
    id: astMsgId,
    conversationId: defaultConvId,
    role: "assistant",
    content: `### 🦅 OpenClaw Agent Console Ready

Worker **\`kaggle-strategist\`** connected.

- **Model Engine**: \`qwen3:14b-q4_K_M\` (4-bit quantized Qwen-14B)
- **Execution Target**: Kaggle GPU Notebook / Ollama Daemon
- **Queue System**: Offline resilient — requests persist if Kaggle restarts or sleeps
- **Check-in Frequency**: Every 5 seconds

\`\`\`python
# Example Kaggle check-in status
{
    "agent": "kaggle-strategist",
    "model": "qwen3:14b-q4_K_M",
    "context_window": 32768,
    "status": "ready"
}
\`\`\`

You can send tasks directly in the message box below. If your Kaggle notebook is offline, requests remain safely queued until the worker connects!`,
    status: "Completed",
    createdAt: new Date(Date.now() - 28000).toISOString(),
    completedAt: new Date(Date.now() - 25000).toISOString(),
    model: "qwen3:14b-q4_K_M",
    agent: "kaggle-strategist",
  };
}

function persistData() {
  try {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(
        {
          conversations,
          messages,
          masterPassword,
          workerState: {
            model: workerState.model,
            agent: workerState.agent,
            isSimulatedWorker: workerState.isSimulatedWorker,
          },
        },
        null,
        2
      )
    );
  } catch (err) {
    console.error("Error saving data:", err);
  }
}

// Background Simulated Worker runner
setInterval(() => {
  if (!workerState.isSimulatedWorker) {
    // If real worker mode, check if worker timed out (no heartbeat in 25s)
    if (workerState.lastCheckIn) {
      const diffSec = (Date.now() - new Date(workerState.lastCheckIn).getTime()) / 1000;
      if (diffSec > 25 && workerState.status !== "Offline") {
        workerState.status = "Offline";
        recentLogs.unshift({
          id: `log_${Date.now()}`,
          timestamp: new Date().toISOString(),
          message: `Worker check-in timed out (${Math.round(diffSec)}s since last ping). Marked as Offline.`,
          level: "warn",
        });
        if (recentLogs.length > 20) recentLogs.pop();
      }
    }
    return;
  }

  // Simulated worker heartbeat
  workerState.lastCheckIn = new Date().toISOString();

  // Check pending tasks in queue
  const pendingTask = requestQueue.find((q) => q.status === "pending");
  if (pendingTask) {
    pendingTask.status = "processing";
    workerState.status = "Thinking";

    const msg = messages[pendingTask.messageId];
    if (msg) {
      msg.status = "Thinking";
      persistData();
    }

    // Simulate processing time 2.5 seconds
    setTimeout(() => {
      if (msg) {
        msg.status = "Completed";
        msg.completedAt = new Date().toISOString();
        msg.content = generateAgentResponse(pendingTask.prompt);
        persistData();
      }

      // Remove from queue
      requestQueue = requestQueue.filter((q) => q.id !== pendingTask.id);
      workerState.status = requestQueue.length > 0 ? "Queued" : "Agent Online";
      recentLogs.unshift({
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        message: `Processed task ${pendingTask.id.slice(-6)} successfully via ${workerState.model}`,
        level: "info",
      });
      if (recentLogs.length > 20) recentLogs.pop();
    }, 2800);
  } else if (workerState.status === "Thinking" && requestQueue.length === 0) {
    workerState.status = "Agent Online";
  }
}, 2000);

function generateAgentResponse(prompt: string): string {
  const clean = prompt.toLowerCase();
  if (clean.includes("code") || clean.includes("python") || clean.includes("script")) {
    return `### ⚡ Strategy & Implementation Plan

Here is the structured solution for your request:

\`\`\`python
# OpenClaw kaggle-strategist task handler
def execute_strategy(query: str, model="qwen3:14b-q4_K_M"):
    """
    Optimized inference pipeline for Kaggle GPU environments.
    """
    context = {
        "agent": "kaggle-strategist",
        "precision": "q4_K_M",
        "pipeline": "openclaw-v1"
    }
    print(f"Executing: {query} with {model}")
    return {"status": "success", "result": "Strategy deployed."}
\`\`\`

**Key considerations:**
1. **Low Latency**: 4-bit quantization allows high-throughput generation on Kaggle T4 / P100 GPUs.
2. **Resilience**: Even during notebook reconnects, tasks queue on Namecheap and resume automatically.`;
  }

  return `### 🎯 Strategic Analysis from \`kaggle-strategist\`

I have processed your query: **"${prompt.slice(0, 100)}"**

1. **Core Assessment**:
   The workflow is aligned with optimal execution parameters. The \`qwen3:14b-q4_K_M\` engine processed the request with full contextual retention.

2. **Actionable Recommendation**:
   - Verify that your Kaggle session remains active or keep the polling worker running in the background.
   - For long-running queries, responses are buffered safely in the queue.

3. **Status Check**:
   - Model: \`${workerState.model}\`
   - Worker State: Active & ready for next command.`;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Portable CORS Middleware - allows frontend to connect from any origin/host/domain
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, X-Worker-Secret");
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Health check & Capabilities Info
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/info", (_req, res) => {
    res.json({
      name: "OpenClaw Personal Agent Console",
      version: "1.0.0",
      portable: true,
      provider: backendAdapter.getActiveProvider(),
      capabilities: backendAdapter.getPublicInfo(),
      worker: {
        status: workerState.status,
        model: workerState.model,
        agent: workerState.agent,
      },
    });
  });

  // Middleware to check authentication token
  const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token || !activeSessions[token] || activeSessions[token].expiresAt < Date.now()) {
      res.status(401).json({ error: "Unauthorized. Please log in." });
      return;
    }
    next();
  };

  // --- API ROUTES FIRST ---

  // 1. Auth: Login
  app.post("/api/auth/login", (req, res) => {
    const { password } = req.body;
    if (password === masterPassword) {
      const token = "tok_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
      const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
      activeSessions[token] = { username: "admin", expiresAt };

      res.json({
        success: true,
        token,
        username: "admin",
        expiresAt: new Date(expiresAt).toISOString(),
      });
    } else {
      res.status(401).json({ error: "Invalid password. Access denied." });
    }
  });

  // 2. Auth: Check session
  app.get("/api/auth/me", (req, res) => {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (token && activeSessions[token] && activeSessions[token].expiresAt > Date.now()) {
      res.json({ authenticated: true, username: "admin" });
    } else {
      res.status(401).json({ authenticated: false });
    }
  });

  // 3. Auth: Logout
  app.post("/api/auth/logout", (req, res) => {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (token) {
      delete activeSessions[token];
    }
    res.json({ success: true });
  });

  // 4. Auth: Change password
  app.post("/api/auth/change-password", requireAuth, (req, res) => {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters long." });
      return;
    }
    masterPassword = newPassword;
    persistData();
    res.json({ success: true, message: "Password updated successfully." });
  });

  // 5. System Status (No secrets exposed)
  app.get("/api/status", (req, res) => {
    const lastCheckIn = workerState.lastCheckIn;
    let secondsAgo: number | null = null;
    if (lastCheckIn) {
      secondsAgo = Math.max(0, Math.round((Date.now() - new Date(lastCheckIn).getTime()) / 1000));
    }

    let status = workerState.status;
    if (!workerState.isSimulatedWorker && (secondsAgo === null || secondsAgo > 25)) {
      status = "Offline";
    } else if (requestQueue.some((q) => q.status === "processing")) {
      status = "Thinking";
    } else if (requestQueue.length > 0 && status !== "Offline" && status !== "Starting") {
      status = "Queued";
    }

    res.json({
      status,
      model: workerState.model,
      agent: workerState.agent,
      lastCheckIn,
      lastCheckInSecondsAgo: secondsAgo,
      queuedRequestsCount: requestQueue.filter((q) => q.status === "pending").length,
      thinkingRequestsCount: requestQueue.filter((q) => q.status === "processing").length,
      recentErrors: recentLogs.slice(0, 8),
      isWorkerSimulationActive: workerState.isSimulatedWorker,
      serverTime: new Date().toISOString(),
      workerEndpoint: `${req.protocol}://${req.get("host")}/api/worker`,
    });
  });

  // 6. Conversations List
  app.get("/api/conversations", requireAuth, (req, res) => {
    const list = Object.values(conversations).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    res.json(list);
  });

  // 7. Create New Conversation
  app.post("/api/conversations", requireAuth, (req, res) => {
    const id = "conv_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const title = (req.body.title || "New Chat").trim();
    const now = new Date().toISOString();
    const newConv: Conversation = {
      id,
      title,
      createdAt: now,
      updatedAt: now,
      messageCount: 0,
      lastMessage: "",
    };
    conversations[id] = newConv;
    persistData();
    res.json(newConv);
  });

  // 8. Rename Conversation
  app.patch("/api/conversations/:id", requireAuth, (req, res) => {
    const { id } = req.params;
    const { title } = req.body;
    if (conversations[id] && title && title.trim()) {
      conversations[id].title = title.trim();
      conversations[id].updatedAt = new Date().toISOString();
      persistData();
      res.json(conversations[id]);
    } else {
      res.status(404).json({ error: "Conversation not found" });
    }
  });

  // 9. Delete Conversation
  app.delete("/api/conversations/:id", requireAuth, (req, res) => {
    const { id } = req.params;
    if (conversations[id]) {
      delete conversations[id];
      // remove associated messages
      for (const msgId in messages) {
        if (messages[msgId].conversationId === id) {
          delete messages[msgId];
        }
      }
      // remove from queue
      requestQueue = requestQueue.filter((q) => q.conversationId !== id);
      persistData();
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Conversation not found" });
    }
  });

  // 10. Get Messages for Conversation
  app.get("/api/conversations/:id/messages", requireAuth, (req, res) => {
    const { id } = req.params;
    const list = Object.values(messages)
      .filter((m) => m.conversationId === id)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    res.json(list);
  });

  // 11. Send Message in Conversation
  app.post("/api/conversations/:id/messages", requireAuth, (req, res) => {
    const { id: convId } = req.params;
    const { content } = req.body;

    if (!conversations[convId]) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }
    if (!content || !content.trim()) {
      res.status(400).json({ error: "Content is required" });
      return;
    }

    const now = new Date().toISOString();

    // User Message
    const userMsgId = "msg_u_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    const userMsg: Message = {
      id: userMsgId,
      conversationId: convId,
      role: "user",
      content: content.trim(),
      status: "Completed",
      createdAt: now,
    };
    messages[userMsgId] = userMsg;

    // Assistant placeholder (Queued)
    const astMsgId = "msg_a_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    const astMsg: Message = {
      id: astMsgId,
      conversationId: convId,
      role: "assistant",
      content: "",
      status: "Queued",
      createdAt: now,
      model: workerState.model,
      agent: workerState.agent,
    };
    messages[astMsgId] = astMsg;

    // Add to request queue
    const taskId = "task_" + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    requestQueue.push({
      id: taskId,
      messageId: astMsgId,
      conversationId: convId,
      prompt: content.trim(),
      queuedAt: now,
      status: "pending",
    });

    // Update conversation title if first user message
    if (conversations[convId].messageCount === 0 || conversations[convId].title === "New Chat") {
      conversations[convId].title = content.trim().slice(0, 32) + (content.length > 32 ? "..." : "");
    }
    conversations[convId].messageCount += 2;
    conversations[convId].updatedAt = now;
    conversations[convId].lastMessage = content.trim().slice(0, 60);

    persistData();

    // If an external direct provider (Ollama / OpenAI-compatible / Webhook) is configured, trigger it asynchronously
    backendAdapter.tryDirectInference(content.trim(), workerState.model, workerState.agent)
      .then((directResult) => {
        if (directResult) {
          astMsg.status = "Completed";
          astMsg.content = directResult.content;
          astMsg.completedAt = new Date().toISOString();
          requestQueue = requestQueue.filter((q) => q.id !== taskId);
          workerState.status = requestQueue.length > 0 ? "Queued" : "Agent Online";
          recentLogs.unshift({
            id: `log_${Date.now()}`,
            timestamp: new Date().toISOString(),
            message: `Processed task via ${directResult.provider} (${directResult.model})`,
            level: "info",
          });
          if (recentLogs.length > 20) recentLogs.pop();
          persistData();
        }
      })
      .catch((err) => {
        console.warn("Direct inference check error, task remains queued for worker:", err);
      });

    res.json({
      userMessage: userMsg,
      assistantMessage: astMsg,
      queuePosition: requestQueue.length,
    });
  });

  // 12. Retry a Message
  app.post("/api/messages/:id/retry", requireAuth, (req, res) => {
    const { id: msgId } = req.params;
    const msg = messages[msgId];
    if (!msg || msg.role !== "assistant") {
      res.status(404).json({ error: "Assistant message not found" });
      return;
    }

    const convId = msg.conversationId;
    const convMsgs = Object.values(messages)
      .filter((m) => m.conversationId === convId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    let prompt = "Please continue processing the request.";
    const myIndex = convMsgs.findIndex((m) => m.id === msgId);
    if (myIndex > 0 && convMsgs[myIndex - 1].role === "user") {
      prompt = convMsgs[myIndex - 1].content;
    }

    msg.status = "Queued";
    msg.error = undefined;
    msg.content = "";

    // Add back to queue
    const taskId = "task_retry_" + Date.now().toString(36);
    requestQueue.push({
      id: taskId,
      messageId: msgId,
      conversationId: convId,
      prompt,
      queuedAt: new Date().toISOString(),
      status: "pending",
    });

    persistData();
    res.json({ success: true, message: msg });
  });

  // 13. Worker: Heartbeat (Kaggle pings every 5s)
  app.post("/api/worker/heartbeat", (req, res) => {
    const { status, model, agent } = req.body;
    workerState.status = status || "Agent Online";
    if (model) workerState.model = model;
    if (agent) workerState.agent = agent;
    workerState.lastCheckIn = new Date().toISOString();

    res.json({
      success: true,
      time: workerState.lastCheckIn,
      queued: requestQueue.filter((q) => q.status === "pending").length,
    });
  });

  // 14. Worker: Poll (Kaggle worker pulls next queued item)
  app.get("/api/worker/poll", (req, res) => {
    workerState.lastCheckIn = new Date().toISOString();

    const pending = requestQueue.find((q) => q.status === "pending");
    if (!pending) {
      res.json({ has_task: false });
      return;
    }

    pending.status = "processing";
    const msg = messages[pending.messageId];
    if (msg) {
      msg.status = "Thinking";
    }
    workerState.status = "Thinking";
    persistData();

    res.json({
      has_task: true,
      task_id: pending.id,
      message_id: pending.messageId,
      conversation_id: pending.conversationId,
      prompt: pending.prompt,
      model: workerState.model,
      agent: workerState.agent,
    });
  });

  // 15. Worker: Respond (Kaggle worker posts result)
  app.post("/api/worker/respond", (req, res) => {
    const { message_id, response, status = "completed", error } = req.body;
    workerState.lastCheckIn = new Date().toISOString();

    const msg = messages[message_id];
    if (msg) {
      if (status === "completed") {
        msg.content = response || "";
        msg.status = "Completed";
        msg.completedAt = new Date().toISOString();
      } else {
        msg.status = "Failed";
        msg.error = error || "Worker inference failed";
        recentLogs.unshift({
          id: `log_${Date.now()}`,
          timestamp: new Date().toISOString(),
          message: error || `Inference error on message ${message_id}`,
          level: "error",
        });
        if (recentLogs.length > 20) recentLogs.pop();
      }
    }

    // Remove from queue
    requestQueue = requestQueue.filter((q) => q.messageId !== message_id);
    workerState.status = requestQueue.length > 0 ? "Queued" : "Agent Online";
    persistData();

    res.json({ success: true });
  });

  // 16. Worker: Toggle Simulator Mode
  app.post("/api/worker/simulate-toggle", requireAuth, (req, res) => {
    workerState.isSimulatedWorker = !workerState.isSimulatedWorker;
    if (workerState.isSimulatedWorker) {
      workerState.status = "Agent Online";
      workerState.lastCheckIn = new Date().toISOString();
    }
    persistData();
    res.json({ isSimulatedWorker: workerState.isSimulatedWorker });
  });

  // 17. Worker: Manual Status Setter (e.g. Test Starting / Offline / Failed)
  app.post("/api/worker/set-status", requireAuth, (req, res) => {
    const { status } = req.body;
    if (["Agent Online", "Starting", "Offline", "Queued", "Thinking", "Failed"].includes(status)) {
      workerState.status = status;
      if (status !== "Offline") {
        workerState.lastCheckIn = new Date().toISOString();
      }
      res.json({ success: true, status: workerState.status });
    } else {
      res.status(400).json({ error: "Invalid status" });
    }
  });

  // 18. Static bundle serving for Namecheap PHP files
  app.use("/namecheap", express.static(path.join(process.cwd(), "public", "namecheap")));

  // --- VITE MIDDLEWARE OR STATIC SERVING ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`OpenClaw Agent Console running on port ${PORT}`);
  });
}

startServer();
