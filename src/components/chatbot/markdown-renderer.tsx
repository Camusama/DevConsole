import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { cn } from './utils'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn('markdown-content', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold mb-4 mt-6 first:mt-0 text-foreground border-b border-border pb-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold mb-3 mt-5 first:mt-0 text-foreground border-b border-border pb-1">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold mb-2 mt-4 first:mt-0 text-foreground">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-semibold mb-2 mt-3 first:mt-0 text-foreground">
              {children}
            </h4>
          ),
          h5: ({ children }) => (
            <h5 className="text-sm font-semibold mb-1 mt-2 first:mt-0 text-foreground">
              {children}
            </h5>
          ),
          h6: ({ children }) => (
            <h6 className="text-xs font-semibold mb-1 mt-2 first:mt-0 text-foreground">
              {children}
            </h6>
          ),

          // Paragraphs
          p: ({ children }) => (
            <p className="mb-3 last:mb-0 text-foreground leading-relaxed">{children}</p>
          ),

          // Lists
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-3 space-y-1 text-foreground">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-3 space-y-1 text-foreground">{children}</ol>
          ),
          li: ({ children }) => <li className="text-foreground leading-relaxed">{children}</li>,

          // Code blocks
          code: ({ node, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '')
            const language = match ? match[1] : ''
            const inline = (props as any).inline
            if (!inline && language) {
              return (
                <div className="my-4 rounded-lg overflow-hidden border border-border">
                  <div className="bg-muted px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border">
                    {language}
                  </div>
                  <SyntaxHighlighter
                    style={oneLight as { [key: string]: React.CSSProperties }}
                    language={language}
                    PreTag="div"
                    customStyle={{
                      margin: 0,
                      padding: '1rem',
                      background: 'hsl(var(--muted))',
                      fontSize: '0.875rem',
                      lineHeight: '1.5',
                    }}
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                </div>
              )
            }

            // Handle block code without language (fallback for pre)
            if (!inline) {
              return (
                <div className="my-4 rounded-lg overflow-hidden border border-border">
                  <div className="bg-muted px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border">
                    code
                  </div>
                  <div className="bg-muted p-4 overflow-x-auto">
                    <code className="text-sm font-mono text-foreground block whitespace-pre">
                      {children}
                    </code>
                  </div>
                </div>
              )
            }

            return (
              <code
                className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground"
                {...props}
              >
                {children}
              </code>
            )
          },

          // Pre blocks - only render if not already handled by code component
          pre: ({ children }) => {
            // Check if this pre contains a code element that was already processed
            const hasCodeChild = React.Children.toArray(children).some(
              child =>
                React.isValidElement(child) &&
                child.type === 'code' &&
                (child.props as any).className?.includes('language-')
            )

            // If it has a code child with language, don't render the pre wrapper
            if (hasCodeChild) {
              return <>{children}</>
            }

            // Otherwise render as a simple pre block
            return (
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-3 text-sm font-mono text-foreground border border-border whitespace-pre-wrap">
                {children}
              </pre>
            )
          },

          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary pl-4 py-2 mb-3 bg-muted/50 rounded-r-lg text-foreground italic">
              {children}
            </blockquote>
          ),

          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
            >
              {children}
            </a>
          ),

          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto mb-3">
              <table className="min-w-full border border-border rounded-lg">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-muted">{children}</thead>,
          tbody: ({ children }) => <tbody className="divide-y divide-border">{children}</tbody>,
          tr: ({ children }) => <tr className="hover:bg-muted/50 transition-colors">{children}</tr>,
          th: ({ children }) => (
            <th className="px-4 py-2 text-left font-semibold text-foreground border-r border-border last:border-r-0">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2 text-foreground border-r border-border last:border-r-0">
              {children}
            </td>
          ),

          // Horizontal rule
          hr: () => <hr className="my-6 border-border" />,

          // Strong and emphasis
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => <em className="italic text-foreground">{children}</em>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
