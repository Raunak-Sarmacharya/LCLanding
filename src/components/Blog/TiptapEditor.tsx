import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from '@tiptap/markdown'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { useCallback, useEffect, useState } from 'react'

interface TiptapEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

// Word/character count helper
function countWords(markdown: string): { words: number; chars: number } {
  if (!markdown) return { words: 0, chars: 0 }
  const stripped = markdown.replace(/#+\s|[*_`>~\[\]()]/g, '').trim()
  const words = stripped ? stripped.split(/\s+/).filter(Boolean).length : 0
  return { words, chars: stripped.length }
}

export default function TiptapEditor({ content, onChange, placeholder = 'Start writing your post...' }: TiptapEditorProps) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [wordCount, setWordCount] = useState({ words: 0, chars: 0 })

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
      }),
      Markdown,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-[var(--color-primary)] underline',
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: content || '',
    contentType: 'markdown',
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[500px] px-6 py-5',
      },
      handleKeyDown: (_view, event) => {
        // ⌘K / Ctrl+K → open link dialog
        if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
          event.preventDefault()
          setLinkDialogOpen(true)
          return true
        }
        return false
      },
    },
    onUpdate: ({ editor }) => {
      try {
        const markdown = editor.getMarkdown()
        onChange(markdown)
        setWordCount(countWords(markdown))
      } catch {
        const html = editor.getHTML()
        onChange(html)
      }
    },
    immediatelyRender: false,
  })

  // Update editor when prop changes (external reset)
  useEffect(() => {
    if (!editor || content === undefined) return
    try {
      const current = editor.getMarkdown()
      if (content !== current) {
        editor.commands.setContent(content || '', { contentType: 'markdown', emitUpdate: false })
        setWordCount(countWords(content))
      }
    } catch {
      try {
        const current = editor.getHTML()
        if (content !== current) {
          editor.commands.setContent(content || '', { emitUpdate: false })
        }
      } catch {}
    }
  }, [content, editor])

  // Init word count
  useEffect(() => {
    if (content) setWordCount(countWords(content))
  }, [])

  const applyLink = useCallback(() => {
    if (!editor) return
    if (linkUrl.trim()) {
      const url = linkUrl.startsWith('http') ? linkUrl.trim() : `https://${linkUrl.trim()}`
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    } else {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    }
    setLinkDialogOpen(false)
    setLinkUrl('')
  }, [editor, linkUrl])

  const openLinkDialog = useCallback(() => {
    if (!editor) return
    const existing = editor.getAttributes('link').href || ''
    setLinkUrl(existing)
    setLinkDialogOpen(true)
  }, [editor])

  if (!editor) {
    return (
      <div className="min-h-[500px] bg-white border border-[var(--color-charcoal)]/20 rounded-xl flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const ToolBtn = ({
    active,
    onClick,
    title,
    children,
  }: {
    active?: boolean
    onClick: () => void
    title: string
    children: React.ReactNode
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`
        h-8 min-w-[32px] px-2 rounded flex items-center justify-center transition-all duration-150 text-sm font-medium select-none
        ${active
          ? 'bg-[var(--color-primary)] text-white shadow-sm'
          : 'text-[var(--color-charcoal)]/70 hover:bg-[var(--color-charcoal)]/8 hover:text-[var(--color-charcoal)]'
        }
      `}
    >
      {children}
    </button>
  )

  const Divider = () => (
    <div className="w-px h-5 bg-[var(--color-charcoal)]/15 mx-1 self-center" />
  )

  return (
    <div className="border border-[var(--color-charcoal)]/20 rounded-xl overflow-hidden bg-white shadow-sm">
      {/* Toolbar */}
      <div className="border-b border-[var(--color-charcoal)]/10 bg-[var(--color-cream)]/60 px-3 py-2 flex flex-wrap items-center gap-0.5">
        {/* Headings */}
        <ToolBtn active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1">
          <span className="font-bold text-[13px] font-mono">H1</span>
        </ToolBtn>
        <ToolBtn active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2">
          <span className="font-bold text-[13px] font-mono">H2</span>
        </ToolBtn>
        <ToolBtn active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading 3">
          <span className="font-bold text-[12px] font-mono">H3</span>
        </ToolBtn>

        <Divider />

        {/* Formatting */}
        <ToolBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold (⌘B)">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h8a4 4 0 010 8H6V4zm0 8h9a4 4 0 010 8H6v-8z"/></svg>
        </ToolBtn>
        <ToolBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic (⌘I)">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M10 4v3h2.21l-3.42 10H6v3h8v-3h-2.21l3.42-10H18V4z"/></svg>
        </ToolBtn>
        <ToolBtn active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="18" y1="12" x2="6" y2="12"/>
            <path strokeLinecap="round" d="M16 6c-1-1.5-2.5-2-4-2-2.5 0-4 1.5-4 3 0 1.2.8 2 2 2.5"/>
            <path strokeLinecap="round" d="M8 18c1 1.5 2.5 2 4 2 2.5 0 4-1.5 4-3 0-1.2-.8-2-2-2.5"/>
          </svg>
        </ToolBtn>
        <ToolBtn active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()} title="Inline Code">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
        </ToolBtn>

        <Divider />

        {/* Lists */}
        <ToolBtn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet List">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="18" r="1" fill="currentColor"/></svg>
        </ToolBtn>
        <ToolBtn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered List">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4" strokeLinecap="round"/><path d="M4 10h2" strokeLinecap="round"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" strokeLinecap="round"/></svg>
        </ToolBtn>
        <ToolBtn active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Blockquote">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/></svg>
        </ToolBtn>

        <Divider />

        {/* Link */}
        <ToolBtn active={editor.isActive('link')} onClick={openLinkDialog} title="Insert Link (⌘K)">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
        </ToolBtn>

        {/* Horizontal Rule */}
        <ToolBtn active={false} onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"/></svg>
        </ToolBtn>

        {/* Word count */}
        <div className="ml-auto flex items-center gap-3 pr-1">
          <span className="text-xs text-[var(--color-charcoal)]/40 font-body tabular-nums">
            {wordCount.words} {wordCount.words === 1 ? 'word' : 'words'}
          </span>
        </div>
      </div>

      {/* Link Dialog */}
      {linkDialogOpen && (
        <div className="border-b border-[var(--color-charcoal)]/10 bg-[var(--color-primary)]/5 px-4 py-3 flex items-center gap-3">
          <svg className="w-4 h-4 text-[var(--color-primary)] shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') applyLink(); if (e.key === 'Escape') setLinkDialogOpen(false) }}
            placeholder="https://example.com"
            autoFocus
            className="flex-1 bg-transparent outline-none font-body text-sm text-[var(--color-charcoal)] placeholder:text-[var(--color-charcoal)]/40"
          />
          <button type="button" onClick={applyLink} className="text-xs font-semibold text-white bg-[var(--color-primary)] px-3 py-1.5 rounded-md hover:bg-[var(--color-primary-dark)] transition-colors">
            Apply
          </button>
          <button type="button" onClick={() => { editor.chain().focus().extendMarkRange('link').unsetLink().run(); setLinkDialogOpen(false) }} className="text-xs font-semibold text-[var(--color-charcoal)]/60 hover:text-[var(--color-charcoal)] transition-colors">
            Remove
          </button>
          <button type="button" onClick={() => setLinkDialogOpen(false)} className="text-[var(--color-charcoal)]/40 hover:text-[var(--color-charcoal)] transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      )}

      {/* Editor Area */}
      <div className="min-h-[500px]">
        <EditorContent editor={editor} />
      </div>

      <style>{`
        .ProseMirror {
          outline: none;
          min-height: 500px;
          padding: 1.25rem 1.5rem;
          font-family: var(--font-body);
          color: var(--color-charcoal);
          font-size: 1.0625rem;
          line-height: 1.8;
        }
        .ProseMirror p { margin: 0.75rem 0; line-height: 1.8; }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: var(--color-charcoal);
          opacity: 0.35;
          pointer-events: none;
          height: 0;
          font-style: italic;
        }
        .ProseMirror h1 { font-size: 2.2rem; font-weight: 700; margin-top: 2rem; margin-bottom: 0.75rem; line-height: 1.2; font-family: var(--font-heading); color: var(--color-charcoal); }
        .ProseMirror h2 { font-size: 1.7rem; font-weight: 700; margin-top: 1.75rem; margin-bottom: 0.6rem; line-height: 1.25; font-family: var(--font-heading); }
        .ProseMirror h3 { font-size: 1.35rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.5rem; line-height: 1.3; font-family: var(--font-heading); }
        .ProseMirror h4, .ProseMirror h5, .ProseMirror h6 { font-weight: 700; margin-top: 1.25rem; margin-bottom: 0.5rem; font-family: var(--font-heading); }
        .ProseMirror ul, .ProseMirror ol { margin: 0.75rem 0; padding-left: 1.75rem; }
        .ProseMirror li { margin: 0.3rem 0; line-height: 1.7; }
        .ProseMirror blockquote { border-left: 3px solid var(--color-primary); padding-left: 1.25rem; margin: 1.25rem 0; font-style: italic; color: var(--color-charcoal); opacity: 0.75; }
        .ProseMirror code { background: var(--color-cream-dark, #f5f0e8); padding: 0.15rem 0.4rem; border-radius: 0.25rem; font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 0.875em; color: var(--color-primary); }
        .ProseMirror pre { background: var(--color-charcoal); color: #e8f5e9; padding: 1.25rem; border-radius: 0.625rem; overflow-x: auto; margin: 1.25rem 0; }
        .ProseMirror pre code { background: none; padding: 0; color: inherit; font-size: 0.9em; }
        .ProseMirror hr { border: none; border-top: 2px solid var(--color-charcoal, #1a1a1a); opacity: 0.12; margin: 2rem 0; }
        .ProseMirror a { color: var(--color-primary); text-decoration: underline; text-underline-offset: 2px; }
        .ProseMirror a:hover { opacity: 0.8; }
        .ProseMirror s { text-decoration: line-through; opacity: 0.7; }
      `}</style>
    </div>
  )
}
