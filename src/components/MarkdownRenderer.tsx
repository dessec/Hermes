import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed text-zinc-900 dark:text-zinc-100">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-xl font-bold mt-4 mb-2 pb-1 border-b border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold mt-3 mb-1.5 text-zinc-900 dark:text-zinc-100">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold mt-2.5 mb-1 text-zinc-800 dark:text-zinc-200">
              {children}
            </h3>
          ),
          p: ({ children }) => <p className="mb-2.5 last:mb-0 text-zinc-800 dark:text-zinc-200">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-5 mb-2.5 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 mb-2.5 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="text-zinc-800 dark:text-zinc-200">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-indigo-500/50 pl-3 py-1 my-2 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-r text-zinc-700 dark:text-zinc-300 italic">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
              <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 text-xs">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-left font-semibold bg-zinc-100 dark:bg-zinc-800/60 text-zinc-800 dark:text-zinc-200">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 border-t border-zinc-200 dark:border-zinc-800/40 text-zinc-700 dark:text-zinc-300">
              {children}
            </td>
          ),
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !className && !String(children).includes('\n');
            const codeString = String(children).replace(/\n$/, '');

            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-indigo-600 dark:text-sky-300 font-mono text-xs"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <CodeBlock language={match ? match[1] : ''} code={codeString} />
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

const CodeBlock: React.FC<{ language: string; code: string }> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  return (
    <div className="relative my-3 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-950 text-zinc-100">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-zinc-900/90 border-b border-zinc-800/80 text-xs font-mono text-zinc-400">
        <span className="uppercase tracking-wider text-[11px] text-zinc-400">
          {language || 'text'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-zinc-800 text-zinc-300 transition-colors text-xs"
          title="Copy Code"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 text-[11px]">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span className="text-[11px]">Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto text-xs font-mono leading-relaxed text-zinc-200">
        <code>{code}</code>
      </pre>
    </div>
  );
};
