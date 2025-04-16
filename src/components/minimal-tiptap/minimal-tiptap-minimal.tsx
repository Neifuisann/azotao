import * as React from 'react'
import './styles/index.css'

import type { Content, Editor } from '@tiptap/react'
import type { UseMinimalTiptapEditorProps } from './hooks/use-minimal-tiptap'
import { EditorContent } from '@tiptap/react'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { SectionTwo } from './components/section/two'
import { SectionThree } from './components/section/three'
import { LinkBubbleMenu } from './components/bubble-menu/link-bubble-menu'
import { useMinimalTiptapEditor } from './hooks/use-minimal-tiptap'
import { MeasuredContainer } from './components/measured-container'
import { Image } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Add custom CSS to fix toolbar button colors
import './toolbar-fix.css'

export interface MinimalTiptapMinimalProps extends Omit<UseMinimalTiptapEditorProps, 'onUpdate'> {
  value?: Content
  onChange?: (value: Content) => void
  className?: string
  editorContentClassName?: string
  onEditorUpdate?: (editor: Editor) => void
  showImageButton?: boolean
}

const MinimalToolbar = ({ editor, showImageButton }: { editor: Editor; showImageButton?: boolean }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && editor) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          editor.chain().focus().setImage({ src: result }).run();
        }
      };
      reader.readAsDataURL(file);
    }
    
    // Reset the input
    if (event.target) {
      event.target.value = '';
    }
  };

  return (
    <div className="shrink-0 overflow-x-auto border-b border-border p-2 bg-white-100 toolbar-container">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
      <div className="flex w-max items-center gap-px">
        <SectionTwo
          editor={editor}
          activeActions={['bold', 'italic', 'underline']}
          mainActionCount={3}
        />

        <Separator orientation="vertical" className="mx-2 h-7" />

        <SectionThree editor={editor} />

        {showImageButton && (
          <>
            <Separator orientation="vertical" className="mx-2 h-7" />
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleImageUpload} 
              className="h-8 w-8 rounded-sm text-gray-700 hover:bg-gray-200 hover:text-gray-900"
            >
              <Image className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

export const MinimalTiptapMinimal = React.forwardRef<HTMLDivElement, MinimalTiptapMinimalProps>(
  ({ value, onChange, className, editorContentClassName, onEditorUpdate, showImageButton = false, ...props }, ref) => {
    const editor = useMinimalTiptapEditor({
      value,
      onUpdate: onChange,
      ...props
    })

    React.useEffect(() => {
      if (editor && onEditorUpdate) {
        onEditorUpdate(editor);
      }
    }, [editor, onEditorUpdate]);

    if (!editor) {
      return null
    }

    return (
      <MeasuredContainer
        as="div"
        name="editor"
        ref={ref}
        className={cn(
          'flex h-auto min-h-72 w-full flex-col rounded-md border border-input shadow-sm focus-within:border-primary',
          className
        )}
      >
        <MinimalToolbar editor={editor} showImageButton={showImageButton} />
        <EditorContent editor={editor} className={cn('minimal-tiptap-editor', editorContentClassName)} />
        <LinkBubbleMenu editor={editor} />
      </MeasuredContainer>
    )
  }
)

MinimalTiptapMinimal.displayName = 'MinimalTiptapMinimal'

export default MinimalTiptapMinimal 