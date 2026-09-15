import React, { useState } from 'react';
import { AppSettings } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { portableFetch } from '../lib/apiClient';
import {
  Settings as SettingsIcon,
  Sun,
  Moon,
  Type,
  Send,
  Lock,
  Download,
  FileCode,
  ArrowLeft,
  Check,
  Smartphone,
  Server,
  HelpCircle,
  Globe,
  Radio,
  RefreshCw,
  Cpu,
} from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onBackToChat: () => void;
  onChangePassword: (newPass: string) => Promise<{ success: boolean; error?: string }>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onBackToChat,
  onChangePassword,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSavingPass, setIsSavingPass] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'namecheap' | 'portability'>('general');

  // Backend Portability State
  const [customApiUrl, setCustomApiUrl] = useState(settings.apiBaseUrl || '');
  const [testStatus, setTestStatus] = useState<{ testing: boolean; result?: string; success?: boolean }>({ testing: false });

  const handleTestEndpoint = async () => {
    setTestStatus({ testing: true });
    const startTime = Date.now();
    try {
      // Save temporarily to test
      onUpdateSettings({ apiBaseUrl: customApiUrl });
      const res = await portableFetch('/api/status');
      const elapsed = Date.now() - startTime;
      if (res.ok) {
        const data = await res.json();
        setTestStatus({
          testing: false,
          success: true,
          result: `Connected in ${elapsed}ms. Worker: ${data.status || 'Active'} (${data.model || 'Model Ready'})`,
        });
      } else {
        setTestStatus({
          testing: false,
          success: false,
          result: `HTTP Error ${res.status}: ${res.statusText}`,
        });
      }
    } catch (err: any) {
      setTestStatus({
        testing: false,
        success: false,
        result: `Connection failed: ${err.message || 'Network error'}`,
      });
    }
  };

  const handleSaveApiUrl = () => {
    onUpdateSettings({ apiBaseUrl: customApiUrl.trim() });
    setTestStatus({ testing: false, success: true, result: 'Backend endpoint saved successfully.' });
  };

  const handleResetApiUrl = () => {
    setCustomApiUrl('');
    onUpdateSettings({ apiBaseUrl: '' });
    setTestStatus({ testing: false, success: true, result: 'Reset to default relative API (/api).' });
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setIsSavingPass(true);
    setPasswordMsg(null);
    try {
      const res = await onChangePassword(newPassword);
      if (res.success) {
        setPasswordMsg({ type: 'success', text: 'Master password changed successfully.' });
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMsg({ type: 'error', text: res.error || 'Failed to update password.' });
      }
    } finally {
      setIsSavingPass(false);
    }
  };

  const handleDownloadPHPZip = () => {
    // We can initiate download or open Namecheap bundle
    window.open('/namecheap/api.php', '_blank');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBackToChat}
            className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Chat</span>
          </button>

          {/* Tab Selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs">
            <button
              onClick={() => setActiveTab('general')}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeTab === 'general'
                  ? 'bg-slate-800 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              General & Controls
            </button>
            <button
              onClick={() => setActiveTab('portability')}
              className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === 'portability'
                  ? 'bg-blue-600/20 text-blue-300 font-medium border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="w-3 h-3 text-blue-400" />
              <span>Backend & Portability</span>
            </button>
            <button
              onClick={() => setActiveTab('namecheap')}
              className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === 'namecheap'
                  ? 'bg-emerald-600/20 text-emerald-300 font-medium border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Server className="w-3 h-3 text-emerald-400" />
              <span>Namecheap PHP Guide</span>
            </button>
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-emerald-400" />
            Console Settings
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Appearance, conversation preferences, and Namecheap hosting deployment tools.
          </p>
        </div>

        {activeTab === 'general' ? (
          <>
            {/* Appearance Section */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-400" />
                Appearance & Theme
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => onUpdateSettings({ theme: 'dark' })}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all text-left ${
                    settings.theme === 'dark'
                      ? 'bg-slate-800 border-emerald-500 text-white shadow-xs'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Moon className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="text-xs font-semibold">Dark Theme (Default)</div>
                      <div className="text-[11px] text-slate-400">High-contrast terminal aesthetic</div>
                    </div>
                  </div>
                  {settings.theme === 'dark' && <Check className="w-4 h-4 text-emerald-400" />}
                </button>

                <button
                  onClick={() => onUpdateSettings({ theme: 'light' })}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all text-left ${
                    settings.theme === 'light'
                      ? 'bg-slate-800 border-emerald-500 text-white shadow-xs'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Sun className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="text-xs font-semibold">Light Theme</div>
                      <div className="text-[11px] text-slate-400">Daylight high-legibility layout</div>
                    </div>
                  </div>
                  {settings.theme === 'light' && <Check className="w-4 h-4 text-emerald-400" />}
                </button>
              </div>

              {/* Font Size Scaling */}
              <div className="pt-3 border-t border-slate-800">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5 mb-2">
                  <Type className="w-3.5 h-3.5 text-slate-400" />
                  Message Font Density
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['compact', 'default', 'spacious'] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => onUpdateSettings({ fontSize: size })}
                      className={`py-2 px-3 rounded-lg text-xs capitalize transition-colors border ${
                        settings.fontSize === size
                          ? 'bg-slate-800 border-slate-600 text-white font-medium'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Conversation Controls */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Send className="w-4 h-4 text-sky-400" />
                Conversation Controls
              </h2>

              <div className="space-y-3 text-xs">
                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:bg-slate-800/30 transition-colors">
                  <div>
                    <span className="font-semibold text-slate-200">Send on Enter</span>
                    <p className="text-[11px] text-slate-400">
                      Pressing Enter submits the message. Shift+Enter inserts a new line.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.sendOnEnter}
                    onChange={(e) => onUpdateSettings({ sendOnEnter: e.target.checked })}
                    className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-emerald-600 focus:ring-0 focus:ring-offset-0"
                  />
                </label>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">Worker Status Polling Interval</span>
                    <span className="font-mono text-emerald-400">5 seconds</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Automatically checks Kaggle worker availability, queue progress, and model readiness every 5 seconds.
                  </p>
                </div>
              </div>
            </div>

            {/* Install PWA Mobile App Card */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h2 className="text-sm font-semibold text-slate-200">
                      Installable PWA Application
                    </h2>
                    <p className="text-xs text-slate-400">
                      Add to your iPhone, Android, or desktop home screen for full-screen console access.
                    </p>
                  </div>
                </div>

                <PWAInstallButton />
              </div>
            </div>

            {/* Master Account Password Change */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                Change Master Password
              </h2>

              <form onSubmit={handlePasswordSubmit} className="space-y-3 max-w-sm">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter at least 6 characters"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-slate-600"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-slate-600"
                  />
                </div>

                {passwordMsg && (
                  <div
                    className={`p-2.5 rounded-lg text-xs font-medium ${
                      passwordMsg.type === 'success'
                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                    }`}
                  >
                    {passwordMsg.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSavingPass}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {isSavingPass ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          </>
        ) : (
          /* Namecheap Deployment Guide Tab */
          <div className="space-y-5">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                    <Server className="w-5 h-5 text-emerald-400" />
                    Hosting on Namecheap Shared cPanel
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    How to deploy this OpenClaw console front-end and PHP API to Namecheap hosting.
                  </p>
                </div>

                <button
                  onClick={handleDownloadPHPZip}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>View api.php</span>
                </button>
              </div>

              <div className="space-y-4 text-xs text-slate-300">
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <h3 className="font-semibold text-emerald-400 text-sm">
                    Step 1: Upload PHP Files to Namecheap
                  </h3>
                  <p>Log into your Namecheap cPanel &rarr; open <strong>File Manager</strong> &rarr; navigate to <code>public_html/</code> (or a subdomain like <code>openclaw.yourdomain.com</code>).</p>
                  <p>Upload the following files generated in your project's <code>public/namecheap/</code> folder:</p>
                  <ul className="list-disc pl-5 space-y-1 font-mono text-[11px] text-slate-400">
                    <li><strong className="text-slate-200">api.php</strong> — Handles queue, sessions, and Kaggle polling</li>
                    <li><strong className="text-slate-200">config.php</strong> — Holds default password & worker secret</li>
                    <li><strong className="text-slate-200">.htaccess</strong> — Prevents direct public access to JSON data files</li>
                    <li><strong className="text-slate-200">kaggle_worker.py</strong> — The Python worker you run in Kaggle</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <h3 className="font-semibold text-emerald-400 text-sm">
                    Step 2: Upload Built Frontend
                  </h3>
                  <p>Run <code>npm run build</code>, then upload the generated files from <code>dist/</code> directly into your Namecheap directory.</p>
                  <p>The single-page web app and PWA will load instantly in the browser and talk to <code>api.php</code> on your Namecheap domain.</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <h3 className="font-semibold text-emerald-400 text-sm">
                    Step 3: Run Worker in Kaggle
                  </h3>
                  <p>In your Kaggle notebook GPU session:</p>
                  <ol className="list-decimal pl-5 space-y-1 text-slate-300">
                    <li>Install Ollama or OpenClaw: <code>curl -fsSL https://ollama.com/install.sh | sh</code></li>
                    <li>Pull the quantized model: <code>ollama run qwen3:14b-q4_K_M</code></li>
                    <li>Run <code>kaggle_worker.py</code> with your Namecheap URL configured!</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Portability & Decoupled Backend View */}
        {activeTab === 'portability' && (
          <div className="space-y-6">
            {/* 1. Connection Endpoint Override */}
            <div className="p-6 rounded-2xl bg-[#121214] border border-[#1F1F23] space-y-4">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-400" />
                <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">
                  Target Backend Endpoint
                </h2>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                OpenClaw is completely decoupled from any single hosting provider. You can point this web console to any remote backend:
                a live Namecheap PHP server, a Docker container, an on-premise Linux server, or keep it on the default same-origin (<code className="text-blue-300">/api</code>).
              </p>

              <div className="space-y-3 pt-2">
                <label className="block text-xs font-medium text-slate-300">
                  Backend Base URL
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={customApiUrl}
                    onChange={(e) => setCustomApiUrl(e.target.value)}
                    placeholder="e.g. https://yourdomain.com/namecheap/api.php or leave empty for same-origin"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleTestEndpoint}
                      disabled={testStatus.testing}
                      className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-600 text-xs text-slate-200 font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <Radio className={`w-3.5 h-3.5 text-blue-400 ${testStatus.testing ? 'animate-pulse' : ''}`} />
                      <span>{testStatus.testing ? 'Testing...' : 'Test Connection'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveApiUrl}
                      className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs text-white font-medium flex items-center gap-1 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Save</span>
                    </button>
                    {customApiUrl && (
                      <button
                        type="button"
                        onClick={handleResetApiUrl}
                        className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                        title="Reset to default /api"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                {testStatus.result && (
                  <div
                    className={`p-3 rounded-lg text-xs font-mono border ${
                      testStatus.success
                        ? 'bg-blue-950/40 border-blue-800/60 text-blue-300'
                        : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                    }`}
                  >
                    {testStatus.result}
                  </div>
                )}
              </div>
            </div>

            {/* 2. Zero Lock-In Export Guides */}
            <div className="p-6 rounded-2xl bg-[#121214] border border-[#1F1F23] space-y-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-emerald-400" />
                <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">
                  Portable Deployment Options
                </h2>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Export this project anytime via the Settings menu or Git. Choose how you want to run it:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
                {/* Option A: Docker */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                  <div className="flex items-center gap-2 text-blue-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                    Option 1: Docker (Single Command)
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Run the included Dockerfile anywhere (AWS, DigitalOcean, local machine):
                  </p>
                  <pre className="p-2 bg-slate-900 rounded font-mono text-[10px] text-slate-300 overflow-x-auto">
docker compose up -d
                  </pre>
                  <p className="text-[10px] text-slate-500">
                    Binds port 3000, preserves state in <code>openclaw_store.json</code>.
                  </p>
                </div>

                {/* Option B: Standard Node.js VPS */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    Option 2: Standalone Node.js
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Standard build and production start without proprietary dependencies:
                  </p>
                  <pre className="p-2 bg-slate-900 rounded font-mono text-[10px] text-slate-300 overflow-x-auto">
npm run build && npm start
                  </pre>
                  <p className="text-[10px] text-slate-500">
                    Serves compiled React frontend and Express API unified on port 3000.
                  </p>
                </div>

                {/* Option C: Namecheap Shared cPanel */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    Option 3: Namecheap Shared PHP
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Runs on $1.50/mo cPanel PHP hosting without Node.js root or daemon access:
                  </p>
                  <p className="text-[11px] text-slate-300">
                    Copy <code>public/namecheap/*</code> to your <code>public_html/</code> folder.
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Uses atomic file locks (<code>flock</code>) for zero-database persistence.
                  </p>
                </div>

                {/* Option D: Kaggle Worker */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                  <div className="flex items-center gap-2 text-purple-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                    Option 4: Kaggle GPU Worker
                  </div>
                  <p className="text-slate-400 text-[11px]">
                    Runs inside Kaggle free T4/P100 notebook GPU instances:
                  </p>
                  <pre className="p-2 bg-slate-900 rounded font-mono text-[10px] text-slate-300 overflow-x-auto">
python3 kaggle_worker.py --url https://your-server.com
                  </pre>
                  <p className="text-[10px] text-slate-500">
                    Pulls tasks from queue, runs Qwen3 14B on Ollama, pushes answers.
                  </p>
                </div>
              </div>
            </div>

            {/* 3. Provider Decoupling Matrix */}
            <div className="p-6 rounded-2xl bg-[#121214] border border-[#1F1F23] space-y-4">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-cyan-400" />
                <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">
                  Provider Decoupling Environment Variables
                </h2>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect the backend to your preferred AI infrastructure simply by setting environment variables in <code className="text-slate-300">.env</code> or container settings:
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2 px-3 font-semibold">Variable</th>
                      <th className="py-2 px-3 font-semibold">Provider / Description</th>
                      <th className="py-2 px-3 font-semibold">Example Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300 text-[11px]">
                    <tr>
                      <td className="py-2.5 px-3 text-cyan-300">OLLAMA_BASE_URL</td>
                      <td className="py-2.5 px-3 text-slate-400">Direct Ollama server (bypasses polling)</td>
                      <td className="py-2.5 px-3 text-slate-500">http://localhost:11434</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 text-cyan-300">OPENAI_COMPATIBLE_URL</td>
                      <td className="py-2.5 px-3 text-slate-400">vLLM, LM Studio, Groq, Together, DeepSeek</td>
                      <td className="py-2.5 px-3 text-slate-500">https://api.openai.com/v1</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 text-cyan-300">OPENAI_API_KEY</td>
                      <td className="py-2.5 px-3 text-slate-400">Bearer token for OpenAI-compatible endpoint</td>
                      <td className="py-2.5 px-3 text-slate-500">sk-...</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 text-cyan-300">AGENT_WEBHOOK_URL</td>
                      <td className="py-2.5 px-3 text-slate-400">Custom remote agent webhook endpoint</td>
                      <td className="py-2.5 px-3 text-slate-500">https://agent.mysite.com/chat</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 text-cyan-300">OPENCLAW_PASSWORD</td>
                      <td className="py-2.5 px-3 text-slate-400">Console single-user master login password</td>
                      <td className="py-2.5 px-3 text-slate-500">openclaw2025</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 text-cyan-300">DATA_FILE_PATH</td>
                      <td className="py-2.5 px-3 text-slate-400">Custom path to storage JSON file</td>
                      <td className="py-2.5 px-3 text-slate-500">/var/data/openclaw.json</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
