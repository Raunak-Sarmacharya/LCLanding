import { useEditor, EditorContent, EditorContext } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Mention from '@tiptap/extension-mention'
import { Markdown } from '@tiptap/markdown'
import { PluginKey } from '@tiptap/pm/state'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { IconBold, IconItalic, IconHeading, IconList, IconListNumbers, IconCode, IconQuote } from '@tabler/icons-react'
import tippy, { Instance as TippyInstance } from 'tippy.js'
import 'tippy.js/dist/tippy.css'

interface TiptapEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  tags?: string[]
  onTagsChange?: (tags: string[]) => void
}

export default function TiptapEditor({ content, onChange, placeholder: _placeholder, tags = [], onTagsChange }: TiptapEditorProps) {
  const [existingTags, setExistingTags] = useState<string[]>(tags)

  // Extract tags from content when it changes
  useEffect(() => {
    if (content) {
      // Parse markdown to extract tags (format: #tag)
      const tagRegex = /#(\w+)/g
      const matches = content.match(tagRegex)
      if (matches) {
        const extractedTags = matches.map(match => match.substring(1)).filter(Boolean)
        if (extractedTags.length > 0 && onTagsChange) {
          onTagsChange(extractedTags)
        }
      }
    }
  }, [content, onTagsChange])

  // Configure mention extension for tags
  const mentionExtension = useMemo(() => {
    return Mention.configure({
      HTMLAttributes: {
        class: 'mention-tag',
      },
      renderText({ node }) {
        return `#${node.attrs.label ?? node.attrs.id}`
      },
      suggestion: {
        char: '#',
        pluginKey: new PluginKey('tagMention'),
        command: ({ editor, range, props }: any) => {
          editor
            .chain()
            .focus()
            .insertContentAt(range, [
              {
                type: 'mention',
                attrs: {
                  id: props.id,
                  label: props.label,
                },
              },
            ])
            .run()

          // Update tags list
          if (props.label && !existingTags.includes(props.label)) {
            const newTags = [...existingTags, props.label]
            setExistingTags(newTags)
            if (onTagsChange) {
              onTagsChange(newTags)
            }
          }
        },
        allow: ({ state, range }: any) => {
          const $from = state.doc.resolve(range.from)
          const type = state.schema.nodes.paragraph
          return !!$from.parent.type.contentMatch.matchType(type)
        },
        items: ({ query }: { query: string }) => {
          // Filter existing tags or return empty for new tags
          const filtered = existingTags
            .filter((tag) => tag.toLowerCase().startsWith(query.toLowerCase()))
            .map((tag) => ({ id: tag, label: tag }))

          // If query doesn't match existing tags, allow creating new tag
          if (query && !existingTags.some(tag => tag.toLowerCase() === query.toLowerCase())) {
            filtered.push({ id: query, label: query })
          }

          return filtered.slice(0, 10) // Limit to 10 suggestions
        },
        render: () => {
          let component: HTMLDivElement | null = null
          let popup: TippyInstance | null = null

          const renderItems = (items: any[], command: (item: any) => void) => {
            if (!component) return

            component.innerHTML = ''

            if (items.length === 0) {
              const emptyDiv = document.createElement('div')
              emptyDiv.className = 'px-3 py-2 text-sm text-[var(--color-charcoal)]/60'
              emptyDiv.textContent = 'No tags found'
              component.appendChild(emptyDiv)
              return
            }

            items.forEach((item) => {
              const button = document.createElement('button')
              button.className = 'w-full text-left px-3 py-2 rounded hover:bg-[var(--color-cream-dark)] transition-colors'
              button.textContent = `#${item.label || item.id}`
              button.addEventListener('click', () => command(item))
              if (component) {
                component.appendChild(button)
              }
            })
          }

          return {
            onStart: (props: any) => {
              component = document.createElement('div')
              component.className = 'bg-white border border-[var(--color-charcoal)]/20 rounded-lg shadow-lg p-1 min-w-[200px] max-h-[300px] overflow-y-auto'

              popup = tippy(document.body, {
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
                content: component,
                showOnCreate: true,
              })

              renderItems(props.items, props.command)
            },
            onUpdate: (props: any) => {
              if (component) {
                renderItems(props.items, props.command)
              }
            },
            onKeyDown: (props: any) => {
              if (props.event.key === 'Escape') {
                if (popup) {
                  popup.destroy()
                  popup = null
                }
                return true
              }
              return false
            },
            onExit: () => {
              if (popup) {
                popup.destroy()
                popup = null
              }
              component = null
            },
          }
        },
      },
    })
  }, [existingTags, onTagsChange])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      mentionExtension,
      Markdown,
    ],
    content: content || '',
    // Set contentType to markdown to ensure initial content is parsed as markdown
    contentType: 'markdown',
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[400px] px-4 py-3',
      },
    },
    onUpdate: ({ editor }) => {
      // Get content as markdown using the proper API
      try {
        // Use getMarkdown() method which is the proper way to serialize to markdown
        const markdown = editor.getMarkdown()
        onChange(markdown)
      } catch (error) {
        // Fallback to HTML if markdown is not available
        console.warn('Markdown serialization not available, using HTML:', error)
        onChange(editor.getHTML())
      }
    },
    immediatelyRender: false,
  })

  // Update editor content when prop changes (but not on every keystroke)
  useEffect(() => {
    if (editor && content !== undefined) {
      try {
        // Get current content as markdown for comparison
        const currentContent = editor.getMarkdown()
        
        // Only update if content has actually changed
        if (content !== currentContent) {
          // Set content as markdown to ensure proper parsing
          // This handles both markdown and HTML content correctly
          editor.commands.setContent(content || '', { 
            contentType: 'markdown',
            emitUpdate: false 
          })
        }
      } catch (error) {
        // If markdown parsing fails, try as HTML
        try {
          const currentContent = editor.getHTML()
          if (content !== currentContent) {
            editor.commands.setContent(content || '', { emitUpdate: false })
          }
        } catch (htmlError) {
          console.warn('Error updating editor content:', error, htmlError)
        }
      }
    }
  }, [content, editor])

  const toggleHeading = useCallback((level: number) => {
    editor?.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 }).run()
  }, [editor])

  const toggleBold = useCallback(() => {
    editor?.chain().focus().toggleBold().run()
  }, [editor])

  const toggleItalic = useCallback(() => {
    editor?.chain().focus().toggleItalic().run()
  }, [editor])

  const toggleBulletList = useCallback(() => {
    editor?.chain().focus().toggleBulletList().run()
  }, [editor])

  const toggleOrderedList = useCallback(() => {
    editor?.chain().focus().toggleOrderedList().run()
  }, [editor])

  const toggleCode = useCallback(() => {
    editor?.chain().focus().toggleCode().run()
  }, [editor])

  const toggleBlockquote = useCallback(() => {
    editor?.chain().focus().toggleBlockquote().run()
  }, [editor])

  if (!editor) {
    return <div className="min-h-[400px] bg-white border border-[var(--color-charcoal)]/20 rounded-lg">Loading editor...</div>
  }

  const isHeading = (level: number) => editor.isActive('heading', { level })
  const isBold = editor.isActive('bold')
  const isItalic = editor.isActive('italic')
  const isBulletList = editor.isActive('bulletList')
  const isOrderedList = editor.isActive('orderedList')
  const isCode = editor.isActive('code')
  const isBlockquote = editor.isActive('blockquote')

  return (
    <EditorContext.Provider value={{ editor }}>
      <div className="border border-[var(--color-charcoal)]/20 rounded-lg overflow-hidden bg-white">
        {/* Toolbar */}
        <div className="border-b border-[var(--color-charcoal)]/10 bg-[var(--color-cream-dark)]/30 p-2 flex flex-wrap gap-1">
          {/* Heading buttons */}
          <div className="flex gap-1 border-r border-[var(--color-charcoal)]/10 pr-2 mr-2">
            <button
              type="button"
              onClick={() => toggleHeading(1)}
              className={`p-2 rounded hover:bg-white transition-colors ${
                isHeading(1) ? 'bg-white border border-[var(--color-primary)]/30' : ''
              }`}
              title="Heading 1"
            >
              <IconHeading className="w-4 h-4 text-[var(--color-charcoal)]" />
            </button>
            <button
              type="button"
              onClick={() => toggleHeading(2)}
              className={`p-2 rounded hover:bg-white transition-colors ${
                isHeading(2) ? 'bg-white border border-[var(--color-primary)]/30' : ''
              }`}
              title="Heading 2"
            >
              <IconHeading className="w-4 h-4 text-[var(--color-charcoal)]" />
            </button>
            <button
              type="button"
              onClick={() => toggleHeading(3)}
              className={`p-2 rounded hover:bg-white transition-colors ${
                isHeading(3) ? 'bg-white border border-[var(--color-primary)]/30' : ''
              }`}
              title="Heading 3"
            >
              <IconHeading className="w-4 h-4 text-[var(--color-charcoal)]" />
            </button>
          </div>

          {/* Formatting buttons */}
          <div className="flex gap-1 border-r border-[var(--color-charcoal)]/10 pr-2 mr-2">
            <button
              type="button"
              onClick={toggleBold}
              className={`p-2 rounded hover:bg-white transition-colors ${
                isBold ? 'bg-white border border-[var(--color-primary)]/30' : ''
              }`}
              title="Bold"
            >
              <IconBold className="w-4 h-4 text-[var(--color-charcoal)]" />
            </button>
            <button
              type="button"
              onClick={toggleItalic}
              className={`p-2 rounded hover:bg-white transition-colors ${
                isItalic ? 'bg-white border border-[var(--color-primary)]/30' : ''
              }`}
              title="Italic"
            >
              <IconItalic className="w-4 h-4 text-[var(--color-charcoal)]" />
            </button>
            <button
              type="button"
              onClick={toggleCode}
              className={`p-2 rounded hover:bg-white transition-colors ${
                isCode ? 'bg-white border border-[var(--color-primary)]/30' : ''
              }`}
              title="Code"
            >
              <IconCode className="w-4 h-4 text-[var(--color-charcoal)]" />
            </button>
          </div>

          {/* List buttons */}
          <div className="flex gap-1 border-r border-[var(--color-charcoal)]/10 pr-2 mr-2">
            <button
              type="button"
              onClick={toggleBulletList}
              className={`p-2 rounded hover:bg-white transition-colors ${
                isBulletList ? 'bg-white border border-[var(--color-primary)]/30' : ''
              }`}
              title="Bullet List"
            >
              <IconList className="w-4 h-4 text-[var(--color-charcoal)]" />
            </button>
            <button
              type="button"
              onClick={toggleOrderedList}
              className={`p-2 rounded hover:bg-white transition-colors ${
                isOrderedList ? 'bg-white border border-[var(--color-primary)]/30' : ''
              }`}
              title="Numbered List"
            >
              <IconListNumbers className="w-4 h-4 text-[var(--color-charcoal)]" />
            </button>
          </div>

          {/* Blockquote */}
          <button
            type="button"
            onClick={toggleBlockquote}
            className={`p-2 rounded hover:bg-white transition-colors ${
              isBlockquote ? 'bg-white border border-[var(--color-primary)]/30' : ''
            }`}
            title="Quote"
          >
            <IconQuote className="w-4 h-4 text-[var(--color-charcoal)]" />
          </button>

          {/* Tag hint */}
          <div className="ml-auto flex items-center gap-2 px-2">
            <span className="text-xs text-[var(--color-charcoal)]/60 font-mono">
              Type # to add tags
            </span>
          </div>
        </div>

        {/* Editor content */}
        <div className="min-h-[400px]">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Custom styles for Tiptap */}
      <style>{`
        .ProseMirror {
          outline: none;
          min-height: 400px;
          padding: 1rem;
          font-family: var(--font-body);
          color: var(--color-charcoal);
        }
        
        .ProseMirror p {
          margin: 0.75rem 0;
          line-height: 1.75;
        }
        
        .ProseMirror h1 {
          font-size: 2.5rem;
          font-weight: 700;
          margin-top: 2rem;
          margin-bottom: 1rem;
          line-height: 1.2;
          font-family: var(--font-heading);
        }
        
        .ProseMirror h2 {
          font-size: 2rem;
          font-weight: 700;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          line-height: 1.2;
          font-family: var(--font-heading);
        }
        
        .ProseMirror h3 {
          font-size: 1.75rem;
          font-weight: 700;
          margin-top: 1.25rem;
          margin-bottom: 0.75rem;
          line-height: 1.2;
          font-family: var(--font-heading);
        }
        
        .ProseMirror h4 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          line-height: 1.2;
          font-family: var(--font-heading);
        }
        
        .ProseMirror h5 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-top: 0.75rem;
          margin-bottom: 0.5rem;
          line-height: 1.2;
          font-family: var(--font-heading);
        }
        
        .ProseMirror h6 {
          font-size: 1rem;
          font-weight: 700;
          margin-top: 0.75rem;
          margin-bottom: 0.5rem;
          line-height: 1.2;
          font-family: var(--font-heading);
        }
        
        .ProseMirror ul, .ProseMirror ol {
          margin: 0.75rem 0;
          padding-left: 1.5rem;
        }
        
        .ProseMirror li {
          margin: 0.25rem 0;
        }
        
        .ProseMirror blockquote {
          border-left: 4px solid var(--color-primary);
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: var(--color-charcoal);
          opacity: 0.8;
        }
        
        .ProseMirror code {
          background: var(--color-cream-dark);
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-family: monospace;
          font-size: 0.9em;
        }
        
        .ProseMirror pre {
          background: var(--color-cream-dark);
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1rem 0;
        }
        
        .ProseMirror pre code {
          background: none;
          padding: 0;
        }
        
        .ProseMirror .mention-tag {
          background: var(--color-butter);
          color: var(--color-charcoal);
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-weight: 500;
          cursor: pointer;
        }
        
        .ProseMirror .is-empty::before {
          content: attr(data-placeholder);
          float: left;
          color: var(--color-charcoal);
          opacity: 0.4;
          pointer-events: none;
          height: 0;
        }
      `}</style>
    </EditorContext.Provider>
  )
}
