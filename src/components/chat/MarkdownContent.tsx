'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

type CitationContext = {
  messageId: string;
  sourceCount: number;
};

export type MarkdownContentProps = {
  content: string;
  className?: string;
  citationContext?: CitationContext;
};

function splitCitations(text: string) {
  // Splits on [1], [2]... while keeping the numbers.
  const citationRegex = /\[(\d+)\]/g;
  return text.split(citationRegex);
}

export function MarkdownContent({ content, className, citationContext }: MarkdownContentProps) {
  return (
    <div className={cn('prose prose-sm dark:prose-invert max-w-none', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 text-primary"
            >
              {children}
            </a>
          ),
          p: ({ children }) => (
            <p className="my-3 first:mt-0 last:mb-0 leading-relaxed">{children}</p>
          ),
          ul: ({ children }) => <ul className="my-3 pl-6 list-disc">{children}</ul>,
          ol: ({ children }) => <ol className="my-3 pl-6 list-decimal">{children}</ol>,
          li: ({ children }) => <li className="my-1">{children}</li>,
          pre: ({ children }) => (
            <pre className="my-3 rounded-lg bg-muted p-3 overflow-x-auto">{children}</pre>
          ),
          code: ({ className: codeClassName, children }) => {
            const isInline = !codeClassName;
            return isInline ? (
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">{children}</code>
            ) : (
              <code className={cn('font-mono text-[0.85em]', codeClassName)}>{children}</code>
            );
          },
          // Render plain text nodes so we can turn [1] into a clickable citation without
          // breaking nested markdown (bold/links/etc.).
          text: ({ children }) => {
            const text = String(children);
            if (!citationContext) return <>{text}</>;

            const parts = splitCitations(text);
            return (
              <>
                {parts.map((part, idx) => {
                  const isCitationNumber = idx % 2 === 1;
                  if (!isCitationNumber) return <React.Fragment key={idx}>{part}</React.Fragment>;

                  const n = Number(part);
                  const inRange = Number.isFinite(n) && n >= 1 && n <= citationContext.sourceCount;
                  if (!inRange) return <React.Fragment key={idx}>[{part}]</React.Fragment>;

                  return (
                    <sup
                      key={idx}
                      className="cursor-pointer font-semibold text-primary mx-0.5"
                      onClick={() => {
                        const el = document.getElementById(`source-${citationContext.messageId}-${n}`);
                        el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                      }}
                    >
                      [{n}]
                    </sup>
                  );
                })}
              </>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
