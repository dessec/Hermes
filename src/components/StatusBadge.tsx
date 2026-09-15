import React from 'react';
import { KaggleStatus } from '../types';
import { CheckCircle2, Clock, AlertTriangle, AlertCircle, RefreshCw, Radio, BrainCircuit } from 'lucide-react';

interface StatusBadgeProps {
  status: KaggleStatus;
  model?: string;
  lastCheckIn?: string | null;
  lastCheckInSecondsAgo?: number | null;
  onClick?: () => void;
  compact?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  model = 'qwen3:14b-q4_K_M',
  lastCheckIn,
  lastCheckInSecondsAgo,
  onClick,
  compact = false,
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'Agent Online':
        return {
          bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
          border: 'border-emerald-500/30',
          text: 'text-emerald-700 dark:text-emerald-400',
          dot: 'bg-emerald-500',
          ping: true,
          icon: <Radio className="w-3.5 h-3.5 text-emerald-500" />,
          label: 'Agent Online',
          desc: 'Kaggle & Ollama ready',
        };
      case 'Starting':
        return {
          bg: 'bg-amber-500/10 dark:bg-amber-500/15',
          border: 'border-amber-500/30',
          text: 'text-amber-700 dark:text-amber-400',
          dot: 'bg-amber-500',
          ping: true,
          icon: <RefreshCw className="w-3.5 h-3.5 text-amber-500 animate-spin" />,
          label: 'Starting',
          desc: 'Model is loading weights',
        };
      case 'Thinking':
        return {
          bg: 'bg-purple-500/10 dark:bg-purple-500/15',
          border: 'border-purple-500/30',
          text: 'text-purple-700 dark:text-purple-400',
          dot: 'bg-purple-500',
          ping: true,
          icon: <BrainCircuit className="w-3.5 h-3.5 text-purple-500 animate-pulse" />,
          label: 'Thinking',
          desc: 'OpenClaw processing',
        };
      case 'Queued':
        return {
          bg: 'bg-sky-500/10 dark:bg-sky-500/15',
          border: 'border-sky-500/30',
          text: 'text-sky-700 dark:text-sky-400',
          dot: 'bg-sky-500',
          ping: false,
          icon: <Clock className="w-3.5 h-3.5 text-sky-500" />,
          label: 'Queued',
          desc: 'Waiting for Kaggle worker',
        };
      case 'Failed':
        return {
          bg: 'bg-rose-500/10 dark:bg-rose-500/15',
          border: 'border-rose-500/30',
          text: 'text-rose-700 dark:text-rose-400',
          dot: 'bg-rose-500',
          ping: false,
          icon: <AlertCircle className="w-3.5 h-3.5 text-rose-500" />,
          label: 'Failed',
          desc: 'Request needs retrying',
        };
      case 'Offline':
      default:
        return {
          bg: 'bg-zinc-500/10 dark:bg-zinc-500/15',
          border: 'border-zinc-400/30 dark:border-zinc-700',
          text: 'text-zinc-600 dark:text-zinc-400',
          dot: 'bg-zinc-400 dark:bg-zinc-500',
          ping: false,
          icon: <AlertTriangle className="w-3.5 h-3.5 text-zinc-400" />,
          label: 'Offline',
          desc: 'Kaggle session is stopped',
        };
    }
  };

  const config = getStatusConfig();

  const formatRelativeTime = () => {
    if (lastCheckInSecondsAgo === null || lastCheckInSecondsAgo === undefined) return 'No check-in yet';
    if (lastCheckInSecondsAgo < 10) return 'Just now';
    if (lastCheckInSecondsAgo < 60) return `${lastCheckInSecondsAgo}s ago`;
    const mins = Math.floor(lastCheckInSecondsAgo / 60);
    return `${mins}m ago`;
  };

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${config.bg} ${config.border} ${config.text} hover:opacity-90`}
        title={`Kaggle Status: ${config.label} (${config.desc}) • Model: ${model}`}
      >
        <span className="relative flex h-2 w-2">
          {config.ping && (
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dot}`} />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dot}`} />
        </span>
        <span className="font-semibold tracking-tight">{config.label}</span>
      </button>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`group flex items-center justify-between gap-3 px-3 py-2 rounded-xl border transition-all cursor-pointer ${config.bg} ${config.border}`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
          {config.ping && (
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dot}`} />
          )}
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${config.dot}`} />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-xs font-bold ${config.text}`}>{config.label}</span>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono hidden sm:inline">
              ({config.desc})
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-zinc-600 dark:text-zinc-400 font-mono truncate">
            <span className="truncate">Model: {model}</span>
            <span>•</span>
            <span className="whitespace-nowrap">Check-in: {formatRelativeTime()}</span>
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 text-xs font-medium opacity-75 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-zinc-600 dark:text-zinc-300">
        Status &rarr;
      </div>
    </div>
  );
};
