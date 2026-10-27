import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface FormattedMarkdownProps {
  content: string;
  className?: string;
}

export default function FormattedMarkdown({ content, className = '' }: FormattedMarkdownProps) {
  if (!content) return null;

  // Sanitize text before passing to ReactMarkdown
  let cleanText = content
    // Replace non-breaking spaces & zero width space
    .replace(/[\u202f\u00a0]/g, ' ')
    .replace(/\u200b/g, '')
    // Standardize unicode hyphens and dashes
    .replace(/[\u2011\u2010\u2012\u2013\u2014]/g, '-')
    // Replace html <br>, <br/>, <br /> with newline
    .replace(/<br\s*\/?>/gi, '\n')
    // Remove unnecessary backslash escapes before punctuation
    .replace(/\\([_\-\*\/\(\)\[\]#])/g, '$1')
    // Replace double slashes
    .replace(/\\{2,}/g, '\\')
    // Remove angled brackets around URLs: <https://...> -> https://...
    .replace(/<(https?:\/\/[^>]+)>/g, '$1');

  return (
    <div className={`formatted-markdown text-left ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-base font-black text-gov-blue-950 font-display mt-4 mb-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm font-black text-gov-blue-950 font-display mt-3.5 mb-1.5 pb-1 border-b border-slate-200">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs font-extrabold text-gov-blue-900 font-display mt-3 mb-1 flex items-center gap-1.5">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-xs font-bold text-gov-blue-900 mt-2.5 mb-1">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="text-slate-700 my-1.5 leading-relaxed text-xs font-medium">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-extrabold text-gov-blue-950">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-slate-800">
              {children}
            </em>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside my-2 space-y-1 text-xs text-slate-700 font-medium pl-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside my-2 space-y-1 text-xs text-slate-700 font-medium pl-1">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed my-0.5">
              {children}
            </li>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gov-blue-600 underline font-bold hover:text-gov-blue-800 transition-colors inline-flex items-center gap-0.5"
            >
              {children}
            </a>
          ),
          hr: () => (
            <hr className="my-3 border-slate-200" />
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-3 border-gov-blue-500 bg-gov-blue-50/50 py-1.5 px-3 italic text-slate-700 my-2.5 rounded-r-lg text-xs">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="bg-slate-100 text-gov-blue-700 px-1.5 py-0.5 rounded font-mono text-[11px] font-bold">
              {children}
            </code>
          ),
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
              <table className="w-full text-left text-xs border-collapse bg-white">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-100 text-gov-blue-900 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-slate-100">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-slate-50/80 transition-colors">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="py-2.5 px-3.5 border-r border-slate-200 last:border-0 font-extrabold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="py-2.5 px-3.5 text-slate-700 font-medium border-r border-slate-100 last:border-0 leading-normal">
              {children}
            </td>
          ),
        }}
      >
        {cleanText}
      </ReactMarkdown>
    </div>
  );
}
