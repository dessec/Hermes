import React, { useState } from 'react';
import { Conversation } from '../types';
import {
  MessageSquare,
  Plus,
  Search,
  Trash2,
  Edit2,
  Check,
  X,
  ArrowLeft,
  Download,
  Calendar,
  Layers,
} from 'lucide-react';

interface ConversationHistoryViewProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onDeleteConversation: (id: string) => void;
  onBackToChat: () => void;
}

export const ConversationHistoryView: React.FC<ConversationHistoryViewProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onRenameConversation,
  onDeleteConversation,
  onBackToChat,
}) => {
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    (c.lastMessage && c.lastMessage.toLowerCase().includes(search.toLowerCase()))
  );

  const handleStartRename = (c: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(c.id);
    setEditingTitle(c.title);
  };

  const handleSaveRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingTitle.trim()) {
      onRenameConversation(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDeleteId === id) {
      onDeleteConversation(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 4000);
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
            onClick={() => {
              onNewConversation();
              onBackToChat();
            }}
            className="flex items-center gap-2 text-xs font-semibold text-white px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              Conversation History
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Browse, rename, reopen, or delete previous agent sessions.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search chat history..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-slate-700"
            />
          </div>
        </div>

        {/* Conversations Grid / List */}
        <div className="space-y-2.5">
          {filtered.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80">
              <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400 font-medium">No conversations found</p>
              <p className="text-xs text-slate-500 mt-1">Try a different search query or start a new conversation.</p>
            </div>
          ) : (
            filtered.map((c) => {
              const isSelected = activeConversationId === c.id;
              const isEditing = editingId === c.id;
              const isDeleting = confirmDeleteId === c.id;

              return (
                <div
                  key={c.id}
                  onClick={() => {
                    if (!isEditing) {
                      onSelectConversation(c.id);
                      onBackToChat();
                    }
                  }}
                  className={`group flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 border-emerald-500/50 shadow-xs'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-800 text-slate-400 group-hover:text-slate-200'
                      }`}
                    >
                      <MessageSquare className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full bg-slate-950 px-2 py-1 rounded text-xs text-white border border-emerald-500 focus:outline-hidden"
                          autoFocus
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-slate-200 truncate">
                            {c.title}
                          </h3>
                          {isSelected && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-medium border border-emerald-500/20">
                              Active
                            </span>
                          )}
                        </div>
                      )}

                      {c.lastMessage && (
                        <p className="text-xs text-slate-400 truncate mt-1">
                          {c.lastMessage}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(c.updatedAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span>•</span>
                        <span>{c.messageCount} messages</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 ml-3 flex-shrink-0">
                    {isEditing ? (
                      <>
                        <button
                          onClick={(e) => handleSaveRename(c.id, e)}
                          className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
                          title="Save title"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(null);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={(e) => handleStartRename(c, e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Rename chat"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(c.id, e)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isDeleting
                              ? 'bg-rose-600 text-white animate-pulse'
                              : 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'
                          }`}
                          title={isDeleting ? 'Click again to confirm delete' : 'Delete chat'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
