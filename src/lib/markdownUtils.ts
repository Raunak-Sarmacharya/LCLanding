/**
 * Simple markdown parser for basic formatting
 * Handles: bold, italic, code, links, headings, lists, blockquotes
 * This is a lightweight parser for the formatting used in TipTap editor
 */

export interface MarkdownNode {
  type: 'text' | 'bold' | 'italic' | 'code' | 'link' | 'heading' | 'paragraph' | 'list' | 'listItem' | 'blockquote' | 'lineBreak'
  content?: string
  children?: MarkdownNode[]
  level?: number
  href?: string
  ordered?: boolean
}

/**
 * Parse markdown text and convert to HTML
 * Handles basic markdown syntax: **bold**, *italic*, `code`, [links](url), # headings
 */
export function markdownToHTML(markdown: string): string {
  if (!markdown || typeof markdown !== 'string') {
    return ''
  }

  let html = markdown

  // Escape existing HTML to prevent XSS
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Process code blocks first (before other formatting)
  html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
  
  // Process inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')

  // Process headings (must be before bold/italic to avoid conflicts)
  html = html.replace(/^###### (.*)$/gm, '<h6>$1</h6>')
  html = html.replace(/^##### (.*)$/gm, '<h5>$1</h5>')
  html = html.replace(/^#### (.*)$/gm, '<h4>$1</h4>')
  html = html.replace(/^### (.*)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.*)$/gm, '<h2>$1</h2>')
  html = html.replace(/^# (.*)$/gm, '<h1>$1</h1>')

  // Process blockquotes
  html = html.replace(/^> (.*)$/gm, '<blockquote>$1</blockquote>')

  // Process links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')

  // Process bold **text** or __text__
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>')

  // Process italic *text* or _text_ (but not if it's part of bold)
  html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
  html = html.replace(/(?<!_)_([^_]+)_(?!_)/g, '<em>$1</em>')

  // Process line breaks (double newline = paragraph break, single = <br>)
  // First, split by double newlines to create paragraphs
  const paragraphs = html.split(/\n\n+/)
  html = paragraphs
    .map((para) => {
      const trimmed = para.trim()
      if (!trimmed) return ''
      
      // If it's already a block element (heading, blockquote, pre), don't wrap
      if (/^<(h[1-6]|blockquote|pre)/.test(trimmed)) {
        return trimmed
      }
      
      // Convert single newlines to <br> within paragraphs
      const withBreaks = trimmed.replace(/\n/g, '<br>')
      return `<p>${withBreaks}</p>`
    })
    .filter(Boolean)
    .join('')

  // Process unordered lists
  html = html.replace(/^[\*\-\+] (.+)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')

  // Process ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
  // Note: This is a simplified approach. For production, use a proper markdown parser

  // Unescape code blocks (they were escaped earlier)
  html = html.replace(/&lt;code&gt;(.*?)&lt;\/code&gt;/g, '<code>$1</code>')
  html = html.replace(/&lt;pre&gt;&lt;code&gt;(.*?)&lt;\/code&gt;&lt;\/pre&gt;/g, '<pre><code>$1</code></pre>')

  return html
}

/**
 * Parse markdown and extract text content (for headings, etc.)
 * Strips all markdown formatting
 */
export function markdownToText(markdown: string): string {
  if (!markdown || typeof markdown !== 'string') {
    return ''
  }

  let text = markdown

  // Remove code blocks
  text = text.replace(/```[\s\S]*?```/g, '')
  text = text.replace(/`[^`]+`/g, '')

  // Remove links but keep text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')

  // Remove formatting but keep text
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1')
  text = text.replace(/__([^_]+)__/g, '$1')
  text = text.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '$1')
  text = text.replace(/(?<!_)_([^_]+)_(?!_)/g, '$1')

  // Remove heading markers
  text = text.replace(/^#{1,6}\s+/gm, '')

  // Remove blockquote markers
  text = text.replace(/^>\s+/gm, '')

  // Remove list markers
  text = text.replace(/^[\*\-\+]\s+/gm, '')
  text = text.replace(/^\d+\.\s+/gm, '')

  return text.trim()
}

