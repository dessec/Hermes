import React, { useState } from 'react';
import { WorkerSystemStatus, Conversation, KaggleStatus } from '../types';
import { StatusBadge } from './StatusBadge';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Cpu,
  Server,
  Layers,
  Activity,
  Send,
  Plus,
  RefreshCw,
  Code,
  Copy,
  Check,
  Zap,
  Settings,
  Download,
  X,
  Clock,
  BrainCircuit,
  AlertCircle,
  Play,
  FileCode,
  Smartphone,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';

interface ConsoleDashboardViewProps {
  userName?: string;
  workerStatus: WorkerSystemStatus | null;
  conversations: Conversation[];
  onSendPrompt: (text: string) => void;
  onOpenChat: (chatId?: string) => void;
  onOpenStatus: () => void;
  onOpenSettings: () => void;
  onNewChat: () => void;
  onToggleSimulator?: () => Promise<void>;
  onSimulateStatus?: (status: KaggleStatus) => Promise<void>;
}

const RELEVANT_CHIPS = [
  { label: 'Run Kaggle Strategy', prompt: 'Formulate an optimal strategy for the dataset and competition baseline.' },
  { label: 'Generate Python Script', prompt: 'Write a robust Python script for data preprocessing and model evaluation.' },
  { label: 'Deep Analysis', prompt: 'Perform a comprehensive reasoning breakdown and step-by-step analysis on: ' },
  { label: 'Debug Code Block', prompt: 'Analyze and debug this Python code, explaining potential bottlenecks and errors:\n\n```python\n\n```' },
  { label: 'Worker Diagnostics', prompt: 'Test OpenClaw worker readiness and verify inference parameter integrity.' },
];

export const ConsoleDashboardView: React.FC<ConsoleDashboardViewProps> = ({
  userName = 'Operator',
  workerStatus,
  conversations,
  onSendPrompt,
  onOpenChat,
  onOpenStatus,
  onOpenSettings,
  onNewChat,
  onToggleSimulator,
  onSimulateStatus,
}) => {
  const [promptText, setPromptText] = useState('');
  const [showPhpModal, setShowPhpModal] = useState(false);
  const [copiedPhp, setCopiedPhp] = useState(false);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim()) return;
    onSendPrompt(promptText.trim());
    setPromptText('');
  };

  const handleCopyPhp = async () => {
    try {
      const res = await fetch('/namecheap/index.php');
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopiedPhp(true);
      setTimeout(() => setCopiedPhp(false), 2000);
    } catch {
      setCopiedPhp(true);
      setTimeout(() => setCopiedPhp(false), 2000);
    }
  };

  const isOffline = workerStatus?.status === 'Offline';
  const recentChats = conversations.slice(0, 4);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0B0B0C] text-[#EDEDED]">
      {/* 1. Slim Top Bar with Relevant OpenClaw Capsules */}
      <header className="h-12 min-h-[48px] px-5 border-b border-[#1F1F23] flex items-center justify-between bg-[#0B0B0C]/90 backdrop-blur-md sticky top-0 z-20">
        {/* Left: Fixed Agent & Model Capsule Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-white mr-2 whitespace-nowrap">
            <span
              className={`w-2 h-2 rounded-full ${
                workerStatus?.status === 'Agent Online'
                  ? 'bg-emerald-400 animate-pulse'
                  : workerStatus?.status === 'Starting'
                  ? 'bg-amber-400 animate-pulse'
                  : workerStatus?.status === 'Thinking'
                  ? 'bg-purple-400 animate-pulse'
                  : 'bg-zinc-500'
              }`}
            />
            <span>OpenClaw Console</span>
          </div>

          <div className="flex items-center gap-1">
            {/* Active Fixed Agent */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-[#18181B] text-white border border-[#27272A] font-medium whitespace-nowrap shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>kaggle-strategist</span>
            </div>

            {/* Fixed Model Capsule */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs text-[#A1A1AA] bg-[#121214] border border-[#1F1F23] whitespace-nowrap font-mono">
              <Cpu className="w-3 h-3 text-sky-400" />
              <span>qwen3:14b-q4_K_M</span>
            </div>

            {/* Kaggle Status Pill */}
            <button
              onClick={onOpenStatus}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs hover:bg-[#18181B] border border-transparent hover:border-[#27272A] transition-colors whitespace-nowrap"
            >
              <Activity className="w-3 h-3 text-emerald-400" />
              <span
                className={`font-medium ${
                  workerStatus?.status === 'Agent Online'
                    ? 'text-emerald-400'
                    : workerStatus?.status === 'Starting'
                    ? 'text-amber-400'
                    : workerStatus?.status === 'Thinking'
                    ? 'text-purple-400'
                    : 'text-zinc-400'
                }`}
              >
                {workerStatus?.status || 'Offline'}
              </span>
            </button>
          </div>
        </div>

        {/* Right-Aligned Navigation & Action Links */}
        <div className="flex items-center gap-3 text-xs text-[#A1A1AA] flex-shrink-0">
          <button
            onClick={() => setShowPhpModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#18181B] border border-[#27272A] hover:border-[#3F3F46] text-emerald-400 hover:text-emerald-300 font-mono text-[11px] transition-colors"
            title="Namecheap PHP Deployment File"
          >
            <Code className="w-3.5 h-3.5" />
            <span>Namecheap PHP</span>
          </button>

          <button
            onClick={onNewChat}
            className="hidden sm:flex items-center gap-1 text-[#EDEDED] hover:text-white transition-colors px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-[#1F1F23]"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>New Chat</span>
          </button>

          <button
            onClick={onOpenStatus}
            className="hidden md:flex items-center gap-1 text-[#71717A] hover:text-[#A1A1AA] transition-colors"
          >
            <Server className="w-3.5 h-3.5" />
            <span>Telemetry</span>
            {workerStatus?.queuedRequestsCount ? (
              <span className="px-1.5 py-0.2 rounded-full bg-sky-500/20 text-sky-300 font-mono text-[10px]">
                {workerStatus.queuedRequestsCount} queued
              </span>
            ) : null}
          </button>

          <button
            onClick={onOpenSettings}
            className="text-[#A1A1AA] hover:text-white transition-colors p-1"
            title="Console Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Offline Alert Bar if Kaggle is not running */}
      {isOffline && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between gap-3 text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              <strong>Kaggle Worker Offline:</strong> Prompts sent below will remain securely in queue and process immediately when Kaggle starts.
            </span>
          </div>
          <button
            onClick={onOpenStatus}
            className="px-2.5 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[11px] font-medium transition-colors"
          >
            Worker Script &rarr;
          </button>
        </div>
      )}

      {/* 2. Main Centered Canvas */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-10 flex flex-col items-center">
        <div className="w-full max-w-[840px] flex flex-col items-center">
          {/* Greeting Section */}
          <div className="text-center mb-7">
            <h1
              className="text-4xl md:text-[42px] font-normal text-white tracking-tight mb-1.5"
              style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif' }}
            >
              Good morning, {userName}
            </h1>
            <p className="text-xs text-[#71717A] font-normal font-mono">
              OpenClaw Agent <strong className="text-[#A1A1AA]">kaggle-strategist</strong> • Model{' '}
              <strong className="text-[#A1A1AA]">qwen3:14b-q4_K_M</strong>
            </p>
          </div>

          {/* Main Prompt Terminal Box */}
          <form
            onSubmit={handleFormSubmit}
            className="w-full bg-[#121214] border border-[#1F1F23] focus-within:border-[#2E2E35] rounded-2xl p-4 mb-4 shadow-2xl shadow-black/60 transition-all"
          >
            <textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleFormSubmit(e);
                }
              }}
              placeholder="Send instruction to OpenClaw (qwen3:14b-q4_K_M)..."
              rows={2}
              className="w-full bg-transparent border-none outline-none resize-none text-sm text-[#EDEDED] placeholder-[#4B4B52] leading-relaxed min-h-[58px]"
            />

            <div className="flex items-center justify-between pt-2.5 mt-1 border-t border-[#1F1F23]/60">
              {/* Left Toolbar Tools */}
              <div className="flex items-center gap-2.5 text-xs text-[#71717A]">
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.04] text-[11px] text-[#A1A1AA]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Kaggle T4/P100</span>
                </div>

                <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.04] text-[11px] text-[#A1A1AA]">
                  <Cpu className="w-3 h-3 text-sky-400" />
                  <span>14B Parameters</span>
                </div>

                {workerStatus?.lastCheckInSecondsAgo !== null && (
                  <span className="text-[11px] text-[#71717A] hidden md:inline">
                    Check-in: {workerStatus?.lastCheckInSecondsAgo}s ago
                  </span>
                )}
              </div>

              {/* Right Action Button */}
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={!promptText.trim()}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:hover:bg-emerald-600 text-white font-medium text-xs flex items-center gap-1.5 transition-all shadow-xs"
                  title="Send to Kaggle Worker"
                >
                  <span>Execute</span>
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </div>
          </form>

          {/* Action Chips Row */}
          <div className="flex items-center justify-center flex-wrap gap-2 mb-10 w-full">
            {RELEVANT_CHIPS.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => setPromptText(chip.prompt)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.02] border border-[#1F1F23] hover:border-[#2E2E35] hover:bg-[#18181B] text-[#A1A1AA] hover:text-[#EDEDED] text-xs transition-all"
              >
                <span>{chip.label}</span>
              </button>
            ))}
          </div>

          {/* Matrix Grid Row 1: Real Previous Chats */}
          <section className="w-full mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-[#71717A]">Previous chats</span>
                <span className="text-[11px] font-mono text-[#4B4B52]">
                  ({conversations.length})
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-[#71717A]">
                <button
                  onClick={onNewChat}
                  className="flex items-center gap-1 hover:text-[#A1A1AA] transition-colors"
                >
                  <Plus className="w-3 h-3 text-emerald-400" />
                  <span>New</span>
                </button>
                <button
                  onClick={() => onOpenChat()}
                  className="flex items-center gap-1 hover:text-[#A1A1AA] transition-colors"
                >
                  <span>View All &rarr;</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
              {recentChats.length === 0 ? (
                <div className="col-span-full p-6 text-center rounded-xl bg-[#121214] border border-[#1F1F23] text-xs text-[#71717A]">
                  No previous chats yet. Type an instruction above or click a quick action.
                </div>
              ) : (
                recentChats.map((chat, idx) => {
                  const colors = ['#10B981', '#06B6D4', '#8B5CF6', '#EC4899'];
                  const dotColor = colors[idx % colors.length];

                  return (
                    <div
                      key={chat.id}
                      onClick={() => onOpenChat(chat.id)}
                      className="p-3.5 rounded-xl bg-[#121214] border border-[#1F1F23] hover:border-[#2E2E35] hover:bg-[#18181B] transition-all cursor-pointer flex flex-col justify-between min-h-[90px] group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: dotColor }}
                          />
                          <span className="text-[10px] text-[#71717A] font-mono">
                            {chat.messageCount} msgs
                          </span>
                        </div>
                        <span className="text-[10px] text-[#71717A] font-mono">
                          {new Date(chat.updatedAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-[#A1A1AA] group-hover:text-[#EDEDED] line-clamp-2 leading-snug font-medium">
                        {chat.title}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Matrix Grid Row 2: Relevant OpenClaw & Kaggle Infrastructure Cards */}
          <section className="w-full mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-[#71717A]">
                Console Infrastructure & Telemetry
              </span>
              <button
                onClick={onOpenStatus}
                className="text-[11px] text-[#71717A] hover:text-[#A1A1AA] transition-colors"
              >
                System Status &rarr;
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
              {/* Card 1: Kaggle Worker */}
              <div
                onClick={onOpenStatus}
                className="p-3.5 rounded-xl bg-[#121214] border border-[#1F1F23] hover:border-[#2E2E35] transition-all flex flex-col justify-between min-h-[114px] cursor-pointer group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-bold">
                        KG
                      </div>
                      <span className="text-xs font-medium text-[#EDEDED]">
                        Kaggle Worker
                      </span>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded border ${
                        workerStatus?.status === 'Agent Online'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}
                    >
                      {workerStatus?.status || 'Offline'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#71717A] line-clamp-2 leading-relaxed">
                    qwen3:14b-q4_K_M loaded in Ollama on Kaggle GPU accelerator.
                  </p>
                </div>
              </div>

              {/* Card 2: Request Broker Queue */}
              <div
                onClick={onOpenStatus}
                className="p-3.5 rounded-xl bg-[#121214] border border-[#1F1F23] hover:border-[#2E2E35] transition-all flex flex-col justify-between min-h-[114px] cursor-pointer group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px]">
                        <Clock className="w-3 h-3" />
                      </div>
                      <span className="text-xs font-medium text-[#EDEDED]">
                        Request Queue
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/[0.04] border border-[#1F1F23] text-sky-400 font-mono">
                      {workerStatus?.queuedRequestsCount ?? 0} queued
                    </span>
                  </div>
                  <p className="text-[11px] text-[#71717A] line-clamp-2 leading-relaxed">
                    Automatic 5s polling broker. Requests remain queued when offline.
                  </p>
                </div>
              </div>

              {/* Card 3: Namecheap PHP API */}
              <div
                onClick={() => setShowPhpModal(true)}
                className="p-3.5 rounded-xl bg-[#121214] border border-[#1F1F23] hover:border-[#2E2E35] transition-all flex flex-col justify-between min-h-[114px] cursor-pointer group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-mono font-bold">
                        PHP
                      </div>
                      <span className="text-xs font-medium text-[#EDEDED]">
                        Namecheap API
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Active
                    </span>
                  </div>
                  <p className="text-[11px] text-[#71717A] line-clamp-2 leading-relaxed">
                    Lightweight JSON file store for Namecheap cPanel hosting.
                  </p>
                </div>
              </div>

              {/* Card 4: Installable PWA */}
              <div
                onClick={onOpenSettings}
                className="p-3.5 rounded-xl bg-[#121214] border border-[#1F1F23] hover:border-[#2E2E35] transition-all flex flex-col justify-between min-h-[114px] cursor-pointer group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px]">
                        <Smartphone className="w-3 h-3" />
                      </div>
                      <span className="text-xs font-medium text-[#EDEDED]">
                        Mobile PWA
                      </span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/[0.04] border border-[#1F1F23] text-[#A1A1AA]">
                      Install
                    </span>
                  </div>
                  <p className="text-[11px] text-[#71717A] line-clamp-2 leading-relaxed">
                    Install console on iPhone or Android home screen for full-screen access.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Modal: View & Download PHP file */}
      {showPhpModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-[#1F1F23] rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="px-5 py-3.5 border-b border-[#1F1F23] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-emerald-400" />
                  <span>Namecheap Production PHP File (index.php)</span>
                </h3>
                <p className="text-[11px] text-[#71717A] mt-0.5">
                  Clean single-file PHP template with Kaggle telemetry, real previous chats, and queue broker.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyPhp}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18181B] border border-[#27272A] hover:bg-[#27272A] text-xs text-white transition-colors"
                >
                  {copiedPhp ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy PHP Code</span>
                    </>
                  )}
                </button>

                <a
                  href="/namecheap/index.php"
                  download="index.php"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>

                <button
                  onClick={() => setShowPhpModal(false)}
                  className="p-1.5 rounded-lg text-[#71717A] hover:text-white hover:bg-white/[0.05]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1 font-mono text-xs text-emerald-300/90 bg-[#0B0B0C]">
              <pre className="whitespace-pre-wrap leading-relaxed">
                <code>{`// File path: /public/namecheap/index.php and /index.php
// Ready for drop-in upload to Namecheap public_html/

<?php
$user_name = "Operator";
$workspace_name = "OpenClaw Console";
$agent_name = "kaggle-strategist";
$model_name = "qwen3:14b-q4_K_M";

// Connected to Namecheap JSON store api.php
// Kaggle Worker polls and responds every 5s automatically!
?>`}</code>
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
