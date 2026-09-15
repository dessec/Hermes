import React, { useState, useEffect, useCallback } from 'react';
import {
  Conversation,
  ChatMessage,
  WorkerSystemStatus,
  AppScreen,
  AppSettings,
  KaggleStatus,
} from './types';
import { Sidebar } from './components/Sidebar';
import { ChatView } from './components/ChatView';
import { ConsoleDashboardView } from './components/ConsoleDashboardView';
import { SystemStatusView } from './components/SystemStatusView';
import { SettingsView } from './components/SettingsView';
import { ConversationHistoryView } from './components/ConversationHistoryView';
import { LoginView } from './components/LoginView';
import {
  portableFetch,
  getStoredApiBaseUrl,
  setStoredApiBaseUrl,
  getStoredToken,
  setStoredToken,
} from './lib/apiClient';

const AUTH_STORAGE_KEY = 'openclaw_token';
const SETTINGS_STORAGE_KEY = 'openclaw_settings';

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  autoPollIntervalSeconds: 5,
  sendOnEnter: true,
  fontSize: 'default',
  showStatusPillInHeader: true,
  apiBaseUrl: getStoredApiBaseUrl(),
};

export default function App() {
  const [token, setToken] = useState<string | null>(() => getStoredToken() || localStorage.getItem(AUTH_STORAGE_KEY));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);

  const [workerStatus, setWorkerStatus] = useState<WorkerSystemStatus | null>(null);
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('dashboard');

  const [isOpenMobileMenu, setIsOpenMobileMenu] = useState<boolean>(false);

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Helper for authenticated requests via portable client
  const apiFetch = useCallback(
    async (endpoint: string, options: RequestInit = {}) => {
      const res = await portableFetch(endpoint, options);
      if (res.status === 401) {
        // Token expired or invalid
        setIsAuthenticated(false);
        setToken(null);
        setStoredToken(null);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
      return res;
    },
    []
  );

  // 1. Initial Authentication Check
  useEffect(() => {
    async function checkAuth() {
      if (!token) {
        setIsAuthenticated(false);
        setIsCheckingAuth(false);
        return;
      }
      try {
        const res = await apiFetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setIsAuthenticated(data.authenticated);
        } else {
          setIsAuthenticated(false);
          setToken(null);
          setStoredToken(null);
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      } catch (err) {
        console.error('Auth verification error:', err);
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
      }
    }
    checkAuth();
  }, [token, apiFetch]);

  // 2. Fetch Kaggle System Status
  const fetchStatus = useCallback(async () => {
    try {
      const res = await portableFetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        setWorkerStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch status:', err);
    }
  }, []);

  // Poll status every 5 seconds (as explicitly requested)
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, settings.autoPollIntervalSeconds * 1000);
    return () => clearInterval(interval);
  }, [fetchStatus, settings.autoPollIntervalSeconds]);

  // 3. Fetch Conversations
  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await apiFetch('/api/conversations');
      if (res.ok) {
        const list: Conversation[] = await res.json();
        setConversations(list);
        if (list.length > 0 && !activeConversationId) {
          setActiveConversationId(list[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
  }, [isAuthenticated, activeConversationId, apiFetch]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchConversations();
    }
  }, [isAuthenticated, fetchConversations]);

  // 4. Fetch Messages for active conversation
  const fetchMessages = useCallback(
    async (convId: string, silent = false) => {
      if (!isAuthenticated || !convId) return;
      if (!silent) setIsLoadingMessages(true);
      try {
        const res = await apiFetch(`/api/conversations/${convId}/messages`);
        if (res.ok) {
          const msgs: ChatMessage[] = await res.json();
          setMessages(msgs);
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
      } finally {
        if (!silent) setIsLoadingMessages(false);
      }
    },
    [isAuthenticated, apiFetch]
  );

  useEffect(() => {
    if (activeConversationId) {
      fetchMessages(activeConversationId);
    } else {
      setMessages([]);
    }
  }, [activeConversationId, fetchMessages]);

  // Fast polling while any message is in Queued or Thinking state
  useEffect(() => {
    if (!activeConversationId) return;
    const hasPending = messages.some((m) => m.status === 'Queued' || m.status === 'Thinking');
    if (!hasPending) return;

    const interval = setInterval(() => {
      fetchMessages(activeConversationId, true);
      fetchStatus();
    }, 2000);

    return () => clearInterval(interval);
  }, [activeConversationId, messages, fetchMessages, fetchStatus]);

  // Actions
  const handleLogin = async (password: string) => {
    try {
      const res = await portableFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        setToken(data.token);
        setStoredToken(data.token);
        localStorage.setItem(AUTH_STORAGE_KEY, data.token);
        setIsAuthenticated(true);
        return { success: true };
      }
      return { success: false, error: data.error || 'Invalid credentials' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Connection failed' };
    }
  };

  const handleLogout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
    setToken(null);
    setStoredToken(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setIsAuthenticated(false);
  };

  const handleNewConversation = async () => {
    try {
      const res = await apiFetch('/api/conversations', {
        method: 'POST',
        body: JSON.stringify({ title: 'New Chat' }),
      });
      if (res.ok) {
        const newConv: Conversation = await res.json();
        setConversations((prev) => [newConv, ...prev]);
        setActiveConversationId(newConv.id);
        setCurrentScreen('chat');
      }
    } catch (err) {
      console.error('Failed to create new conversation:', err);
    }
  };

  const handleRenameConversation = async (id: string, newTitle: string) => {
    try {
      const res = await apiFetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: newTitle }),
      });
      if (res.ok) {
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
        );
      }
    } catch (err) {
      console.error('Failed to rename conversation:', err);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      const res = await apiFetch(`/api/conversations/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const remaining = conversations.filter((c) => c.id !== id);
        setConversations(remaining);
        if (activeConversationId === id) {
          setActiveConversationId(remaining.length > 0 ? remaining[0].id : null);
        }
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const handleSendMessage = async (text: string) => {
    let targetConvId = activeConversationId;

    // If no conversation exists yet, create one first
    if (!targetConvId) {
      const createRes = await apiFetch('/api/conversations', {
        method: 'POST',
        body: JSON.stringify({ title: text.slice(0, 24) }),
      });
      if (!createRes.ok) throw new Error('Could not create conversation');
      const newConv: Conversation = await createRes.json();
      setConversations((prev) => [newConv, ...prev]);
      targetConvId = newConv.id;
      setActiveConversationId(newConv.id);
    }

    // Optimistic UI updates
    const tempUserMsg: ChatMessage = {
      id: 'temp_u_' + Date.now(),
      conversationId: targetConvId,
      role: 'user',
      content: text,
      status: 'Completed',
      createdAt: new Date().toISOString(),
    };

    const tempAstMsg: ChatMessage = {
      id: 'temp_a_' + Date.now(),
      conversationId: targetConvId,
      role: 'assistant',
      content: '',
      status: 'Queued',
      createdAt: new Date().toISOString(),
      model: workerStatus?.model || 'qwen3:14b-q4_K_M',
      agent: workerStatus?.agent || 'kaggle-strategist',
    };

    setMessages((prev) => [...prev, tempUserMsg, tempAstMsg]);

    const res = await apiFetch(`/api/conversations/${targetConvId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content: text }),
    });

    if (res.ok) {
      const data = await res.json();
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempUserMsg.id
            ? data.userMessage
            : m.id === tempAstMsg.id
            ? data.assistantMessage
            : m
        )
      );
      fetchConversations();
      fetchStatus();
    } else {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempAstMsg.id
            ? { ...m, status: 'Failed', error: 'Failed to queue message' }
            : m
        )
      );
    }
  };

  const handleRetryMessage = async (messageId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, status: 'Queued', error: undefined } : m
      )
    );

    const res = await apiFetch(`/api/messages/${messageId}/retry`, {
      method: 'POST',
    });
    if (res.ok) {
      fetchStatus();
    }
  };

  const handleUpdateSettings = (newSettings: Partial<AppSettings>) => {
    if (newSettings.apiBaseUrl !== undefined) {
      setStoredApiBaseUrl(newSettings.apiBaseUrl);
    }
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
    fetchStatus();
  };

  const handleChangePassword = async (newPassword: string) => {
    const res = await apiFetch('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
    const data = await res.json();
    return { success: res.ok, error: data.error };
  };

  const handleToggleSimulator = async () => {
    const res = await apiFetch('/api/worker/simulate-toggle', { method: 'POST' });
    if (res.ok) {
      fetchStatus();
    }
  };

  const handleSimulateStatus = async (status: KaggleStatus) => {
    const res = await apiFetch('/api/worker/set-status', {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      fetchStatus();
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-xs text-slate-400 font-mono">
        Connecting to OpenClaw personal gateway...
      </div>
    );
  }

  // 1. Login Screen
  if (!isAuthenticated) {
    return <LoginView onLogin={handleLogin} />;
  }

  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null;

  const isLight = settings.theme === 'light';

  return (
    <div className={`h-screen w-screen overflow-hidden flex ${isLight ? 'light bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'}`}>
      {/* 2. Conversation Sidebar */}
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={(id) => {
          setActiveConversationId(id);
          setCurrentScreen('chat');
        }}
        onNewConversation={handleNewConversation}
        onRenameConversation={handleRenameConversation}
        onDeleteConversation={handleDeleteConversation}
        currentScreen={currentScreen}
        onNavigate={(screen) => setCurrentScreen(screen)}
        workerStatus={workerStatus}
        onLogout={handleLogout}
        isOpenMobile={isOpenMobileMenu}
        onCloseMobile={() => setIsOpenMobileMenu(false)}
      />

      {/* Main Content Area Based on Screen */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {currentScreen === 'dashboard' && (
          <ConsoleDashboardView
            userName="Operator"
            workerStatus={workerStatus}
            conversations={conversations}
            onSendPrompt={(prompt) => {
              handleSendMessage(prompt);
              setCurrentScreen('chat');
            }}
            onOpenChat={(chatId) => {
              if (chatId) {
                const found = conversations.find((c) => c.id === chatId);
                if (found) setActiveConversationId(chatId);
              }
              setCurrentScreen('chat');
            }}
            onOpenStatus={() => setCurrentScreen('status')}
            onOpenSettings={() => setCurrentScreen('settings')}
            onNewChat={handleNewConversation}
            onToggleSimulator={handleToggleSimulator}
            onSimulateStatus={handleSimulateStatus}
          />
        )}

        {currentScreen === 'chat' && (
          <ChatView
            conversation={activeConversation}
            messages={messages}
            workerStatus={workerStatus}
            onSendMessage={handleSendMessage}
            onRetryMessage={handleRetryMessage}
            onOpenMobileMenu={() => setIsOpenMobileMenu(true)}
            onOpenStatus={() => setCurrentScreen('status')}
            isLoadingMessages={isLoadingMessages}
            fontSize={settings.fontSize}
            sendOnEnter={settings.sendOnEnter}
          />
        )}

        {currentScreen === 'history' && (
          <ConversationHistoryView
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={(id) => {
              setActiveConversationId(id);
              setCurrentScreen('chat');
            }}
            onNewConversation={handleNewConversation}
            onRenameConversation={handleRenameConversation}
            onDeleteConversation={handleDeleteConversation}
            onBackToChat={() => setCurrentScreen('chat')}
          />
        )}

        {currentScreen === 'status' && (
          <SystemStatusView
            status={workerStatus}
            onBackToChat={() => setCurrentScreen('chat')}
            onRefresh={fetchStatus}
            onToggleSimulator={handleToggleSimulator}
            onSimulateStatus={handleSimulateStatus}
          />
        )}

        {currentScreen === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onBackToChat={() => setCurrentScreen('chat')}
            onChangePassword={handleChangePassword}
          />
        )}
      </main>
    </div>
  );
}
