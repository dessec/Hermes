import React, { useState } from 'react';
import { Lock, KeyRound, Eye, EyeOff, ShieldCheck, ArrowRight, RotateCw } from 'lucide-react';

interface LoginViewProps {
  onLogin: (password: string) => Promise<{ success: boolean; error?: string }>;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Please enter your master password.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await onLogin(password);
      if (!res.success) {
        setError(res.error || 'Invalid password. Access denied.');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-950 text-slate-100">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Card */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/40">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">
            OpenClaw Agent Console
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Personal Gateway • Private Single-Account Access
          </p>
        </div>

        {/* Login Box */}
        <div className="p-6 md:p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl shadow-black/60 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800 text-xs text-slate-400 font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Target Agent: kaggle-strategist (qwen3:14b)</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Master Password</span>
                <span className="text-[10px] text-slate-500 font-mono">Private Account</span>
              </label>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter console password..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/60 pr-10"
                  autoFocus
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-md shadow-emerald-950/50 disabled:opacity-50"
            >
              {isLoading ? (
                <RotateCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Unlock Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-500 font-mono">
            <span>Default initial password: </span>
            <code className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">openclaw2025</code>
          </div>
        </div>

        <div className="text-center text-[11px] text-slate-600">
          No public signups. Single private owner console.
        </div>
      </div>
    </div>
  );
};
