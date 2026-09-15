import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Conversation, WorkerSystemStatus } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { StatusBadge } from './StatusBadge';
import {
  Send,
  Copy,
  Check,
  RotateCw,
  Clock,
  BrainCircuit,
  AlertCircle,
  Menu,
  Sparkles,
  Bot,
  User,
  Info,
  ShieldCheck,
  ArrowDown,
} from 'lucide-react';

interface ChatViewProps {
  conversation: Conversation | null;
  messages: ChatMessage[];
  workerStatus: WorkerSystemStatus | null;
  onSendMessage: (text: string) => Promise<void>;
  onRetryMessage: (messageId: string) => Promise<void>;
  onOpenMobileMenu: () => void;
  onOpenStatus: () => void;
  isLoadingMessages: boolean;
  fontSize: 'compact' | 'default' | 'spacious';
  sendOnEnter: boolean;
}

export const ChatView: React.FC<ChatViewProps> = ({
  conversation,
  messages,
  workerStatus,
  onSendMessage,
  onRetryMessage,
  onOpenMobileMenu,
  onOpenStatus,
  isLoadingMessages,
  fontSize,
  sendOnEnter,
}) => {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [conversation?.id]);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages.length, messages[messages.length - 1]?.status, messages[messages.length - 1]?.content]);

  // Handle scroll detection
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollBottom(!isNearBottom);
  };

  // Adjust textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [inputText]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || isSending) return;

    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    setIsSending(true);
    try {
      await onSendMessage(trimmed);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (sendOnEnter && e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  const handleRetry = async (id: string) => {
    setRetryingId(id);
    try {
      await onRetryMessage(id);
    } finally {
      setRetryingId(null);
    }
  };

  const fontSizeClasses = {
    compact: 'text-xs',
    default: 'text-sm',
    spacious: 'text-base',
  }[fontSize];

  const isKaggleOffline = workerStatus?.status === 'Offline';

  return (
    <div className="flex flex-col flex-1 h-full min-w-0 bg-slate-950 text-slate-100 relative">
      {/* Header with Conversation Title & Kaggle Status Badge */}
      <header className="h-16 px-4 border-b border-slate-800/80 flex items-center justify-between gap-3 bg-slate-900/60 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileMenu}
            className="p-2 -ml-1 text-slate-400 hover:text-white rounded-lg md:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-100 truncate">
              {conversation?.title || 'OpenClaw Agent Console'}
            </h2>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
              <span>Agent: kaggle-strategist</span>
              <span>•</span>
              <span className="hidden sm:inline">Model: {workerStatus?.model || 'qwen3:14b-q4_K_M'}</span>
            </div>
          </div>
        </div>

        {/* Kaggle Status Panel Badge */}
        <div className="flex items-center gap-2">
          {workerStatus && (
            <StatusBadge
              status={workerStatus.status}
              model={workerStatus.model}
              lastCheckIn={workerStatus.lastCheckIn}
              lastCheckInSecondsAgo={workerStatus.lastCheckInSecondsAgo}
              onClick={onOpenStatus}
            />
          )}
        </div>
      </header>

      {/* Offline Status Warning Banner */}
      {isKaggleOffline && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between gap-2 text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>
              <strong>Kaggle worker is currently offline.</strong> Requests remain queued and will automatically execute when your Kaggle session starts.
            </span>
          </div>
          <button
            onClick={onOpenStatus}
            className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[11px] font-medium whitespace-nowrap transition-colors"
          >
            View Worker Script &rarr;
          </button>
        </div>
      )}

      {/* Message List Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6"
      >
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-48 text-xs text-slate-400">
            <RotateCw className="w-4 h-4 animate-spin mr-2 text-emerald-400" />
            Loading conversation history...
          </div>
        ) : messages.length === 0 ? (
          <div className="max-w-md mx-auto my-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-100">
              OpenClaw Agent Console
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Connected to <strong>kaggle-strategist</strong> running <strong>qwen3:14b-q4_K_M</strong>.
              Send your instructions below. Tasks are routed safely through your request queue.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';

            return (
              <div
                key={msg.id}
                className={`flex gap-3.5 max-w-3xl mx-auto ${
                  isUser ? 'justify-end' : 'justify-start'
                }`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`flex flex-col min-w-0 max-w-[85%] md:max-w-[78%] ${
                    isUser ? 'items-end' : 'items-start'
                  }`}
                >
                  {/* Sender & Timestamp */}
                  <div className="flex items-center gap-2 mb-1 text-[11px] font-mono text-slate-400">
                    <span className="font-semibold text-slate-300">
                      {isUser ? 'You' : 'OpenClaw (kaggle-strategist)'}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {!isUser && msg.model && (
                      <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-300">
                        {msg.model}
                      </span>
                    )}
                  </div>

                  {/* Message Bubble Container */}
                  <div
                    className={`rounded-2xl p-4 transition-all shadow-xs ${
                      isUser
                        ? 'bg-emerald-600 text-white rounded-tr-xs'
                        : 'bg-slate-900 border border-slate-800/90 text-slate-100 rounded-tl-xs w-full'
                    }`}
                  >
                    {isUser ? (
                      <p className={`whitespace-pre-wrap break-words ${fontSizeClasses}`}>
                        {msg.content}
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {/* State: Queued */}
                        {msg.status === 'Queued' && (
                          <div className="flex items-center gap-2.5 py-2 text-sky-400 text-xs">
                            <Clock className="w-4 h-4 animate-pulse flex-shrink-0" />
                            <span>
                              Request is queued for Kaggle worker. Waiting for execution...
                            </span>
                          </div>
                        )}

                        {/* State: Thinking */}
                        {msg.status === 'Thinking' && (
                          <div className="flex items-center gap-2.5 py-2 text-purple-400 text-xs">
                            <BrainCircuit className="w-4 h-4 animate-spin flex-shrink-0" />
                            <span>
                              OpenClaw agent is generating response with qwen3:14b-q4_K_M...
                            </span>
                          </div>
                        )}

                        {/* State: Failed */}
                        {msg.status === 'Failed' && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-rose-400 text-xs">
                              <AlertCircle className="w-4 h-4 flex-shrink-0" />
                              <span>{msg.error || 'Request execution failed on Kaggle worker.'}</span>
                            </div>
                            <button
                              onClick={() => handleRetry(msg.id)}
                              disabled={retryingId === msg.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-medium transition-colors"
                            >
                              <RotateCw
                                className={`w-3.5 h-3.5 ${
                                  retryingId === msg.id ? 'animate-spin' : ''
                                }`}
                              />
                              <span>Retry Request</span>
                            </button>
                          </div>
                        )}

                        {/* State: Completed with Markdown */}
                        {msg.status === 'Completed' && (
                          <div className={fontSizeClasses}>
                            <MarkdownRenderer content={msg.content} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions under Assistant Message (Copy Response) */}
                  {!isUser && msg.status === 'Completed' && (
                    <div className="flex items-center gap-2 mt-1.5 pl-1">
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors p-1 rounded hover:bg-slate-800/60"
                        title="Copy Response"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 font-mono">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Response</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-24 right-8 p-2 rounded-full bg-slate-800/90 text-slate-200 border border-slate-700 shadow-lg hover:bg-slate-700 transition-all z-20"
          title="Scroll to bottom"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}

      {/* Message Input Box */}
      <div className="p-4 md:p-6 bg-slate-900/40 border-t border-slate-800/80 sticky bottom-0 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative">
          <div className="relative rounded-2xl bg-slate-900 border border-slate-800 focus-within:border-slate-600 focus-within:ring-1 focus-within:ring-slate-600 transition-all shadow-lg overflow-hidden">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Send instruction to OpenClaw (qwen3:14b-q4_K_M)..."
              rows={1}
              className="w-full bg-transparent px-4 py-3.5 pr-14 text-sm text-slate-100 placeholder-slate-500 resize-none focus:outline-hidden max-h-44"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isSending}
              className="absolute right-2.5 bottom-2.5 p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:hover:bg-emerald-600 text-white transition-all flex items-center justify-center"
              title="Send message"
            >
              {isSending ? (
                <RotateCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 px-1 font-mono">
            <span>
              {sendOnEnter ? 'Press Enter to send, Shift+Enter for new line' : 'Shift+Enter or button to send'}
            </span>
            <span className="hidden sm:inline">
              Worker target: <strong className="text-slate-400">kaggle-strategist</strong>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};
