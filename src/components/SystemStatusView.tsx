import React, { useState } from 'react';
import { WorkerSystemStatus, KaggleStatus } from '../types';
import { StatusBadge } from './StatusBadge';
import {
  Activity,
  Cpu,
  Server,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Play,
  RotateCw,
  Clock,
  Terminal,
  ArrowLeft,
  Radio,
  FileCode,
  ShieldCheck,
} from 'lucide-react';

interface SystemStatusViewProps {
  status: WorkerSystemStatus | null;
  onBackToChat: () => void;
  onRefresh: () => void;
  onToggleSimulator: () => Promise<void>;
  onSimulateStatus: (status: KaggleStatus) => Promise<void>;
}

export const SystemStatusView: React.FC<SystemStatusViewProps> = ({
  status,
  onBackToChat,
  onRefresh,
  onToggleSimulator,
  onSimulateStatus,
}) => {
  const [copiedScript, setCopiedScript] = useState(false);
  const [isTogglingSim, setIsTogglingSim] = useState(false);

  const kagglePythonScript = `import time, requests, json

CONSOLE_URL = "${status?.workerEndpoint?.replace('/api/worker', '') || 'https://your-domain.com'}/api/worker"
MODEL_NAME = "qwen3:14b-q4_K_M"
AGENT_NAME = "kaggle-strategist"

print("Connecting to OpenClaw Console...")

while True:
    try:
        # 1. Heartbeat check-in
        requests.post(f"{CONSOLE_URL}/heartbeat", json={
            "status": "Agent Online",
            "model": MODEL_NAME,
            "agent": AGENT_NAME
        }, timeout=8)

        # 2. Poll for queued task
        res = requests.get(f"{CONSOLE_URL}/poll", timeout=8)
        if res.status_code == 200:
            task = res.json()
            if task.get("has_task"):
                print(f"[Task Received] {task['task_id']}")
                # Run Ollama inference...
                # res = ollama.generate(model=MODEL_NAME, prompt=task['prompt'])
                # 3. Submit generated response
                requests.post(f"{CONSOLE_URL}/respond", json={
                    "message_id": task["message_id"],
                    "response": "Analysis complete from Kaggle OpenClaw worker.",
                    "status": "completed"
                })
    except Exception as e:
        print("Worker error:", e)
    time.sleep(5)`;

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(kagglePythonScript);
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    } catch (e) {
      console.error('Copy failed', e);
    }
  };

  const handleToggle = async () => {
    setIsTogglingSim(true);
    try {
      await onToggleSimulator();
    } finally {
      setIsTogglingSim(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBackToChat}
            className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Chat</span>
          </button>

          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Refresh (auto every 5s)</span>
          </button>
        </div>

        {/* Page Title */}
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            System & Kaggle Worker Status
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry and health monitoring for Kaggle OpenClaw execution environment.
          </p>
        </div>

        {/* Big Status Banner */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                <Cpu className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-slate-100">
                    Primary Worker Status
                  </h2>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 font-mono text-slate-300">
                    5s Polling
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Assigned Model: <strong>{status?.model || 'qwen3:14b-q4_K_M'}</strong> | Agent: <strong>{status?.agent || 'kaggle-strategist'}</strong>
                </p>
              </div>
            </div>

            {status && (
              <StatusBadge
                status={status.status}
                model={status.model}
                lastCheckIn={status.lastCheckIn}
                lastCheckInSecondsAgo={status.lastCheckInSecondsAgo}
              />
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <span className="text-[11px] text-slate-400">Worker Status</span>
              <p className="text-sm font-semibold text-slate-100 mt-0.5">
                {status?.status || 'Unknown'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <span className="text-[11px] text-slate-400">Queued Requests</span>
              <p className="text-sm font-semibold text-sky-400 mt-0.5">
                {status?.queuedRequestsCount ?? 0} waiting
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <span className="text-[11px] text-slate-400">Active Inference</span>
              <p className="text-sm font-semibold text-purple-400 mt-0.5">
                {status?.thinkingRequestsCount ?? 0} running
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60">
              <span className="text-[11px] text-slate-400">Last Worker Check-in</span>
              <p className="text-sm font-semibold text-slate-200 mt-0.5 font-mono">
                {status?.lastCheckInSecondsAgo !== null && status?.lastCheckInSecondsAgo !== undefined
                  ? `${status.lastCheckInSecondsAgo}s ago`
                  : 'Never'}
              </p>
            </div>
          </div>
        </div>

        {/* 6 Kaggle Status Definitions Legend */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Server className="w-4 h-4 text-sky-400" />
            Status Definition Matrix
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
            <div className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
              <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Agent Online
              </div>
              <p className="text-slate-400 mt-1 text-[11px]">Kaggle and Ollama daemon are fully loaded and ready for queries.</p>
            </div>

            <div className="p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/5">
              <div className="font-semibold text-amber-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Starting
              </div>
              <p className="text-slate-400 mt-1 text-[11px]">Worker connected, pulling model weights into GPU VRAM.</p>
            </div>

            <div className="p-2.5 rounded-xl border border-zinc-700 bg-zinc-800/30">
              <div className="font-semibold text-zinc-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-zinc-500" />
                Offline
              </div>
              <p className="text-slate-400 mt-1 text-[11px]">Kaggle session stopped. Requests remain safe in request queue.</p>
            </div>

            <div className="p-2.5 rounded-xl border border-sky-500/30 bg-sky-500/5">
              <div className="font-semibold text-sky-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                Queued
              </div>
              <p className="text-slate-400 mt-1 text-[11px]">Request waiting in broker queue for worker pickup.</p>
            </div>

            <div className="p-2.5 rounded-xl border border-purple-500/30 bg-purple-500/5">
              <div className="font-semibold text-purple-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                Thinking
              </div>
              <p className="text-slate-400 mt-1 text-[11px]">OpenClaw is generating token inference on Kaggle GPU.</p>
            </div>

            <div className="p-2.5 rounded-xl border border-rose-500/30 bg-rose-500/5">
              <div className="font-semibold text-rose-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                Failed
              </div>
              <p className="text-slate-400 mt-1 text-[11px]">Worker timeout or error. 1-click retry available in chat.</p>
            </div>
          </div>
        </div>

        {/* Worker Simulator Controls (For testing when Kaggle is offline) */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                Worker Simulation & Testing
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Toggle simulator to test chat processing without running your Kaggle notebook.
              </p>
            </div>

            <button
              onClick={handleToggle}
              disabled={isTogglingSim}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                status?.isWorkerSimulationActive
                  ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {isTogglingSim ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              <span>{status?.isWorkerSimulationActive ? 'Simulator Active' : 'Enable Simulator'}</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <span className="text-xs text-slate-400 py-1">Simulate Status:</span>
            {(['Agent Online', 'Starting', 'Offline', 'Thinking', 'Failed'] as KaggleStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => onSimulateStatus(s)}
                className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
              >
                Set {s}
              </button>
            ))}
          </div>
        </div>

        {/* Kaggle Worker Python Snippet */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-indigo-400" />
                Kaggle Notebook Worker Script
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Paste this into a Kaggle Notebook code cell and run with GPU accelerator.
              </p>
            </div>

            <button
              onClick={handleCopyScript}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
            >
              {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedScript ? 'Copied!' : 'Copy Script'}</span>
            </button>
          </div>

          <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300/90 overflow-x-auto max-h-60 leading-relaxed">
            <code>{kagglePythonScript}</code>
          </pre>
        </div>

        {/* Recent Error & Event Logs (No Secrets) */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Recent Event & Error Log
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">
              Secrets redacted
            </span>
          </div>

          <div className="space-y-2">
            {!status?.recentErrors || status.recentErrors.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">No recent errors reported.</p>
            ) : (
              status.recentErrors.map((err) => (
                <div
                  key={err.id}
                  className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs"
                >
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase ${
                      err.level === 'error'
                        ? 'bg-rose-500/20 text-rose-300'
                        : err.level === 'warn'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {err.level}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-300">{err.message}</p>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(err.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
