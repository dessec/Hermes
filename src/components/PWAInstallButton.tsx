import React, { useState } from 'react';
import { Download, Smartphone, X, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={
          compact
            ? "flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 transition-colors"
            : "flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors"
        }
        title="Install OpenClaw Console as an App"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install PWA</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={
            compact
              ? "flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-colors"
              : "flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
          }
        >
          <Smartphone className="w-3.5 h-3.5 text-sky-400" />
          <span>Install iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-semibold">Install on iOS</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-slate-800 text-emerald-400 font-mono text-xs">1</span>
                  <p>In Safari, tap the <strong className="text-white">Share</strong> button (box with upward arrow) on the toolbar.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-slate-800 text-emerald-400 font-mono text-xs">2</span>
                  <p>Scroll down in the share sheet and tap <strong className="text-white">Add to Home Screen</strong>.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-slate-800 text-emerald-400 font-mono text-xs">3</span>
                  <p>Tap <strong className="text-white">Add</strong> in top-right. The OpenClaw icon will appear on your home screen!</p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full rounded-lg bg-slate-800 hover:bg-slate-700 py-2.5 text-xs font-medium text-slate-200 transition-colors flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
