import React, { useState } from 'react';
import { Conversation, WorkerSystemStatus, AppScreen } from '../types';
import {
  Home,
  MessageSquare,
  Activity,
  Settings,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  LogOut,
  ChevronRight,
  Layers,
  Plus,
  Radio,
  Cpu,
  Shield,
  Clock,
  Sparkles,
  Inbox,
} from 'lucide-react';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onDeleteConversation: (id: string) => void;
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  workerStatus: WorkerSystemStatus | null;
  onLogout: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onRenameConversation,
  onDeleteConversation,
  currentScreen,
  onNavigate,
  workerStatus,
  onLogout,
  isOpenMobile,
  onCloseMobile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startEditing = (c: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(c.id);
    setEditingTitle(c.title);
  };

  const saveEditing = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingTitle.trim()) {
      onRenameConversation(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDeleteId === id) {
      onDeleteConversation(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 4000);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Agent Online':
        return 'bg-emerald-500 shadow-emerald-500/50';
      case 'Starting':
        return 'bg-amber-500 shadow-amber-500/50';
      case 'Thinking':
        return 'bg-purple-500 shadow-purple-500/50';
      case 'Queued':
        return 'bg-sky-500 shadow-sky-500/50';
      case 'Failed':
        return 'bg-rose-500 shadow-rose-500/50';
      default:
        return 'bg-zinc-500';
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs md:hidden transition-opacity"
        />
      )}

      {/* 240px Sleek Dark Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-[240px] min-w-[240px] bg-[#121214] border-r border-[#1F1F23] transition-transform duration-200 ease-in-out md:translate-x-0 select-none ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        } md:static md:z-10`}
      >
        {/* Top Header: Console Brand */}
        <div className="p-3 border-b border-[#1F1F23]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-xs shadow-xs">
                OC
              </div>
              <div className="min-w-0">
                <h2 className="text-xs font-semibold text-[#EDEDED] tracking-tight leading-none truncate">
                  OpenClaw Console
                </h2>
                <p className="text-[10px] text-[#71717A] font-mono mt-0.5 truncate">
                  kaggle-strategist
                </p>
              </div>
            </div>

            {/* Online Pulse Dot */}
            <span
              className={`w-2 h-2 rounded-full shadow-xs ${getStatusColor(
                workerStatus?.status || 'Offline'
              )}`}
              title={workerStatus?.status || 'Offline'}
            />
          </div>

          {/* New Chat Primary Button */}
          <button
            onClick={() => {
              onNewConversation();
              onNavigate('chat');
              onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Conversation</span>
          </button>
        </div>

        {/* Navigation Links */}
        <div className="px-2 pt-2 pb-1 space-y-0.5 border-b border-[#1F1F23] text-xs">
          <button
            onClick={() => {
              onNavigate('dashboard');
              onCloseMobile();
            }}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-colors ${
              currentScreen === 'dashboard'
                ? 'bg-white/[0.08] text-white font-medium'
                : 'text-[#A1A1AA] hover:text-white hover:bg-[#18181B]'
            }`}
          >
            <Home className="w-3.5 h-3.5 opacity-80" />
            <span>Console Home</span>
          </button>

          <button
            onClick={() => {
              onNavigate('chat');
              onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors ${
              currentScreen === 'chat'
                ? 'bg-white/[0.08] text-white font-medium'
                : 'text-[#A1A1AA] hover:text-white hover:bg-[#18181B]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <MessageSquare className="w-3.5 h-3.5 opacity-80" />
              <span>Active Chat</span>
            </div>
            {conversations.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/[0.08] text-[#A1A1AA]">
                {conversations.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              onNavigate('history');
              onCloseMobile();
            }}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md transition-colors ${
              currentScreen === 'history'
                ? 'bg-white/[0.08] text-white font-medium'
                : 'text-[#A1A1AA] hover:text-white hover:bg-[#18181B]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 opacity-80" />
            <span>All Conversations</span>
          </button>

          <button
            onClick={() => {
              onNavigate('status');
              onCloseMobile();
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors ${
              currentScreen === 'status'
                ? 'bg-white/[0.08] text-white font-medium'
                : 'text-[#A1A1AA] hover:text-white hover:bg-[#18181B]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Kaggle Status</span>
            </div>
            {workerStatus?.queuedRequestsCount ? (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sky-500/20 text-sky-300 font-mono">
                {workerStatus.queuedRequestsCount}
              </span>
            ) : null}
          </button>
        </div>

        {/* Search Input for Conversations */}
        <div className="p-2 border-b border-[#1F1F23]">
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2 top-2 text-[#71717A]" />
            <input
              type="text"
              placeholder="Filter chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0B0B0C] border border-[#1F1F23] rounded-md pl-7 pr-2 py-1 text-xs text-[#EDEDED] placeholder-[#4B4B52] focus:outline-hidden focus:border-[#2E2E35]"
            />
          </div>
        </div>

        {/* Real Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5 no-scrollbar">
          <div className="px-2 py-1 text-[10px] font-medium text-[#71717A] uppercase tracking-wider">
            History ({filteredConversations.length})
          </div>

          {filteredConversations.length === 0 ? (
            <div className="px-2 py-6 text-center text-xs text-[#71717A]">
              No chats yet.
            </div>
          ) : (
            filteredConversations.map((c) => {
              const isActive = currentScreen === 'chat' && activeConversationId === c.id;
              const isEditing = editingId === c.id;
              const isDeleting = confirmDeleteId === c.id;

              return (
                <div
                  key={c.id}
                  onClick={() => {
                    if (!isEditing) {
                      onSelectConversation(c.id);
                      onNavigate('chat');
                      onCloseMobile();
                    }
                  }}
                  className={`group relative flex items-center justify-between px-2 py-1.5 rounded-md text-xs cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-white/[0.08] text-white font-medium'
                      : 'text-[#A1A1AA] hover:bg-[#18181B] hover:text-[#EDEDED]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <MessageSquare
                      className={`w-3 h-3 flex-shrink-0 ${
                        isActive ? 'text-emerald-400' : 'text-[#71717A]'
                      }`}
                    />
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full bg-[#0B0B0C] px-1 py-0.5 rounded text-xs text-white border border-emerald-500 focus:outline-hidden"
                        autoFocus
                      />
                    ) : (
                      <span className="truncate text-[11px]">{c.title}</span>
                    )}
                  </div>

                  {/* Rename / Delete Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isEditing ? (
                      <>
                        <button
                          onClick={(e) => saveEditing(c.id, e)}
                          className="p-0.5 hover:text-emerald-400"
                          title="Save"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="p-0.5 hover:text-[#71717A]"
                          title="Cancel"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={(e) => startEditing(c, e)}
                          className="p-0.5 text-[#71717A] hover:text-white"
                          title="Rename"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteClick(c.id, e)}
                          className={`p-0.5 transition-colors ${
                            isDeleting
                              ? 'text-rose-400 animate-pulse'
                              : 'text-[#71717A] hover:text-rose-400'
                          }`}
                          title={isDeleting ? 'Confirm delete' : 'Delete chat'}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Live Kaggle Status Card in Sidebar */}
        <div className="p-2 border-t border-[#1F1F23] bg-[#0B0B0C]/60">
          <button
            onClick={() => {
              onNavigate('status');
              onCloseMobile();
            }}
            className="w-full text-left p-2 rounded-lg bg-[#121214] border border-[#1F1F23] hover:border-[#2E2E35] transition-all"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${getStatusColor(
                    workerStatus?.status || 'Offline'
                  )}`}
                />
                <span className="text-[11px] font-medium text-[#EDEDED]">
                  {workerStatus?.status || 'Offline'}
                </span>
              </div>
              <ChevronRight className="w-3 h-3 text-[#71717A]" />
            </div>
            <div className="text-[10px] font-mono text-[#71717A] flex items-center justify-between">
              <span>qwen3:14b</span>
              <span>Kaggle T4/P100</span>
            </div>
          </button>
        </div>

        {/* User Account & Bottom Actions */}
        <div className="p-2.5 border-t border-[#1F1F23] bg-[#121214] space-y-1">
          <div className="flex items-center justify-between px-2 py-1 text-xs">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => {
                onNavigate('settings');
                onCloseMobile();
              }}
            >
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-[10px] font-mono text-emerald-400 font-bold">
                OP
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#EDEDED] truncate leading-none">
                  Private Account
                </p>
                <p className="text-[10px] text-[#71717A] font-mono mt-0.5">Admin</p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[#71717A]">
              <button
                onClick={() => {
                  onNavigate('settings');
                  onCloseMobile();
                }}
                className="p-1 hover:text-white transition-colors"
                title="Settings"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onLogout}
                className="p-1 hover:text-rose-400 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
