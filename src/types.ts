export type KaggleStatus =
  | 'Agent Online'
  | 'Starting'
  | 'Offline'
  | 'Queued'
  | 'Thinking'
  | 'Failed';

export type MessageStatus = 'Queued' | 'Thinking' | 'Completed' | 'Failed';

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  status: MessageStatus;
  createdAt: string;
  completedAt?: string;
  model?: string;
  agent?: string;
  error?: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastMessage?: string;
  messageCount: number;
}

export interface WorkerSystemStatus {
  status: KaggleStatus;
  model: string;
  agent: string;
  lastCheckIn: string | null;
  lastCheckInSecondsAgo: number | null;
  queuedRequestsCount: number;
  thinkingRequestsCount: number;
  recentErrors: {
    id: string;
    timestamp: string;
    message: string;
    level: 'info' | 'warn' | 'error';
  }[];
  isWorkerSimulationActive: boolean;
  serverTime: string;
  workerEndpoint: string;
}

export type AppScreen = 'dashboard' | 'chat' | 'history' | 'status' | 'settings';

export interface AgentInfo {
  name: string;
  active: boolean;
  status?: string;
}

export interface SuggestedApp {
  id: string;
  name: string;
  description: string;
  iconBg: string;
  iconText: string;
  status: string;
}

export interface DashboardChatCard {
  id: string;
  title: string;
  tagColor: string;
  dots: number;
  date: string;
}


export interface UserSession {
  username: string;
  token: string;
  expiresAt: string;
}

export interface AppSettings {
  theme: 'dark' | 'light';
  autoPollIntervalSeconds: number;
  sendOnEnter: boolean;
  fontSize: 'compact' | 'default' | 'spacious';
  showStatusPillInHeader: boolean;
}
