"use client";

import ReactMarkdown from "react-markdown";

export function MarkdownRenderer({ content }: { content: string }) {
  if (!content) return null;
  return (
    <div className="text-sm text-white/70 [&_p]:leading-relaxed [&_p]:my-1 [&_strong]:font-semibold [&_strong]:text-white/90 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1 [&_ul]:space-y-0.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1 [&_ol]:space-y-0.5 [&_li]:leading-relaxed [&_blockquote]:border-l-2 [&_blockquote]:border-indigo-500/50 [&_blockquote]:pl-3 [&_blockquote]:my-2 [&_blockquote]:italic [&_blockquote]:text-white/70 [&_code]:rounded [&_code]:bg-white/[0.08] [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1 [&_h3]:text-white/90">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
