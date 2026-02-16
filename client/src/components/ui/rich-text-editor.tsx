import { useEditor, EditorContent } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import Youtube from '@tiptap/extension-youtube'
import Placeholder from '@tiptap/extension-placeholder'
import { Button } from '@/components/ui/button'
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  List, 
  ListOrdered, 
  Link as LinkIcon, 
  Youtube as YoutubeIcon,
  Heading2,
  Heading3,
  Undo,
  Redo,
  Type
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCallback, useEffect } from 'react'

interface RichTextEditorProps {
  content: string
  onChange: (content: string, html: string) => void
  placeholder?: string
  className?: string
}

function ToolbarButton({ 
  onClick, 
  active, 
  disabled, 
  children, 
  testId 
}: { 
  onClick: () => void
  active?: boolean
  disabled?: boolean
  children: React.ReactNode
  testId?: string 
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      disabled={disabled}
      className={cn("h-7 w-7", active && 'bg-muted')}
      data-testid={testId}
    >
      {children}
    </Button>
  )
}

function FormatButtons({ editor, setLink }: { editor: ReturnType<typeof useEditor>; setLink: () => void }) {
  if (!editor) return null
  return (
    <>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        testId="button-bold"
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        testId="button-italic"
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive('underline')}
        testId="button-underline"
      >
        <UnderlineIcon className="h-4 w-4" />
      </ToolbarButton>
      <div className="w-px h-5 bg-border mx-0.5 self-center" />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive('heading', { level: 2 })}
        testId="button-h2"
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor.isActive('heading', { level: 3 })}
        testId="button-h3"
      >
        <Heading3 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setParagraph().run()}
        active={editor.isActive('paragraph')}
        testId="button-paragraph"
      >
        <Type className="h-4 w-4" />
      </ToolbarButton>
      <div className="w-px h-5 bg-border mx-0.5 self-center" />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        testId="button-bullet-list"
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        testId="button-ordered-list"
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
      <div className="w-px h-5 bg-border mx-0.5 self-center" />
      <ToolbarButton
        onClick={setLink}
        active={editor.isActive('link')}
        testId="button-link"
      >
        <LinkIcon className="h-4 w-4" />
      </ToolbarButton>
    </>
  )
}

export function RichTextEditor({ content, onChange, placeholder = "Escreva seu conteúdo aqui...", className }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
        },
      }),
      Underline,
      Youtube.configure({
        inline: false,
        width: 640,
        height: 360,
        allowFullscreen: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg dark:prose-invert focus:outline-none min-h-[200px] p-4',
      },
    },
    onUpdate: ({ editor }) => {
      const json = JSON.stringify(editor.getJSON())
      const html = editor.getHTML()
      onChange(json, html)
    },
  })

  useEffect(() => {
    if (editor && content) {
      try {
        const parsed = JSON.parse(content)
        if (editor.getJSON() !== parsed) {
          editor.commands.setContent(parsed)
        }
      } catch {
        if (editor.getText() !== content) {
          editor.commands.setContent(content)
        }
      }
    }
  }, [content, editor])

  const setLink = useCallback(() => {
    if (!editor) return

    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL do link:', previousUrl)

    if (url === null) {
      return
    }

    if (url === '') {
      editor.chain().extendMarkRange('link').unsetLink().run()
      return
    }

    editor.chain().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  const addYoutubeVideo = useCallback(() => {
    if (!editor) return

    const url = window.prompt('URL do vídeo do YouTube:')

    if (url) {
      editor.commands.setYoutubeVideo({
        src: url,
      })
    }
  }, [editor])

  if (!editor) {
    return null
  }

  return (
    <div className={cn("border rounded-md", className)}>
      <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/50">
        <FormatButtons editor={editor} setLink={setLink} />
        <ToolbarButton
          onClick={addYoutubeVideo}
          testId="button-youtube"
        >
          <YoutubeIcon className="h-4 w-4" />
        </ToolbarButton>
        <div className="w-px h-5 bg-border mx-0.5 self-center" />
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          testId="button-undo"
        >
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          testId="button-redo"
        >
          <Redo className="h-4 w-4" />
        </ToolbarButton>
      </div>

      {editor && (
        <BubbleMenu
          editor={editor}
          options={{
            placement: 'bottom',
            offset: 8,
          }}
          className="flex items-center gap-0.5 p-1 bg-popover border border-border rounded-lg shadow-lg z-50"
        >
          <FormatButtons editor={editor} setLink={setLink} />
        </BubbleMenu>
      )}

      <EditorContent editor={editor} className="min-h-[200px]" />
    </div>
  )
}
