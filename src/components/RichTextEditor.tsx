import React, { useCallback, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Mention from '@tiptap/extension-mention';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { createLowlight } from 'lowlight';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import java from 'highlight.js/lib/languages/java';
import cpp from 'highlight.js/lib/languages/cpp';
import css from 'highlight.js/lib/languages/css';
import html from 'highlight.js/lib/languages/xml';
import json from 'highlight.js/lib/languages/json';
import sql from 'highlight.js/lib/languages/sql';
import 'highlight.js/styles/github.css';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  Code, 
  Link as LinkIcon,
  Image as ImageIcon,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  X
} from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { api, searchApi } from '../services/api';
import { useToast } from './ui/Toast';

interface RichTextEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  className?: string;
  editable?: boolean;
  onImageUpload?: (file: File) => Promise<void>;
  onMentionSearch?: (query: string) => Promise<any[]>;
  showToolbar?: boolean;
  maxLength?: number;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content = '',
  onChange,
  placeholder = 'Start writing...',
  className = '',
  editable = true,
  onImageUpload,
  onMentionSearch,
  showToolbar = true,
  maxLength = 10000
}) => {
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const { success, error } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Create lowlight instance with syntax highlighting
  const lowlight = createLowlight();
  lowlight.register('javascript', javascript);
  lowlight.register('typescript', typescript);
  lowlight.register('python', python);
  lowlight.register('java', java);
  lowlight.register('cpp', cpp);
  lowlight.register('css', css);
  lowlight.register('html', html);
  lowlight.register('json', json);
  lowlight.register('sql', sql);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        codeBlock: false, // Disable default code block
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: 'javascript',
      }),
      CharacterCount,
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary-600 hover:text-primary-700 underline',
        },
      }),
      Mention.configure({
        HTMLAttributes: {
          class: 'bg-primary-100 text-primary-800 px-1 py-0.5 rounded text-sm',
        },
        suggestion: {
          items: async ({ query }) => {
            try {
              if (query.length < 2) return [];
              
              const users = await searchApi.searchUsers(query, 10);
              return users.map((user: any) => ({
                id: user.id,
                label: user.name || user.username,
                username: user.username,
                avatar: user.avatarUrl
              }));
            } catch (error) {
              console.error('Error searching users:', error);
              return [];
            }
          },
          render: () => {
            let component: any;
            let popup: any;

            return {
              onStart: (props: any) => {
                component = new MentionList({
                  props,
                  editor: props.editor,
                });
                popup = tippy('body', {
                  getReferenceClientRect: props.clientRect,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: 'manual',
                  placement: 'bottom-start',
                });
              },
              onUpdate: (props: any) => {
                component.updateProps(props);
                popup[0].setProps({
                  getReferenceClientRect: props.clientRect,
                });
              },
              onKeyDown: (props: any) => {
                if (props.event.key === 'Escape') {
                  popup[0].hide();
                  return true;
                }
                return component.onKeyDown(props);
              },
              onExit: () => {
                popup[0].destroy();
                component.destroy();
              },
            };
          },
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] p-4',
      },
    },
  });

  const handleImageUpload = useCallback(async (file: File) => {
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.uploadImage(formData);
      
      if (response.success && response.url) {
        editor?.chain().focus().setImage({ src: response.url }).run();
        success('Image uploaded successfully');
      } else {
        throw new Error(response.error || 'Upload failed');
      }
    } catch (err: any) {
      error('Failed to upload image', err.message);
    } finally {
      setIsUploadingImage(false);
    }
  }, [editor, success, error]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  }, [handleImageUpload]);

  const insertLink = useCallback(() => {
    if (!linkUrl) return;
    
    editor?.chain().focus().setLink({ href: linkUrl }).run();
    setShowLinkDialog(false);
    setLinkUrl('');
    setLinkText('');
  }, [editor, linkUrl]);

  const removeLink = useCallback(() => {
    editor?.chain().focus().unsetLink().run();
  }, [editor]);

  const insertMention = useCallback(() => {
    editor?.chain().focus().insertContent(' @').run();
  }, [editor]);

  const insertHashtag = useCallback(() => {
    editor?.chain().focus().insertContent(' #').run();
  }, [editor]);

  if (!editor) {
    return (
      <div className={`border border-neutral-200 dark:border-neutral-700 rounded-xl ${className}`}>
        <div className="p-4">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2"></div>
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`border border-neutral-200 dark:border-neutral-700 rounded-xl ${className}`}>
      {/* Toolbar */}
      {showToolbar && editable && (
        <div className="flex flex-wrap items-center gap-1 p-3 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
          {/* Text Formatting */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={editor.isActive('bold') ? 'bg-neutral-200 dark:bg-neutral-700' : ''}
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={editor.isActive('italic') ? 'bg-neutral-200 dark:bg-neutral-700' : ''}
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={editor.isActive('strike') ? 'bg-neutral-200 dark:bg-neutral-700' : ''}
            >
              <Strikethrough className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleCode().run()}
              className={editor.isActive('code') ? 'bg-neutral-200 dark:bg-neutral-700' : ''}
            >
              <Code className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={editor.isActive('codeBlock') ? 'bg-neutral-200 dark:bg-neutral-700' : ''}
            >
              <Code className="h-4 w-4" />
            </Button>
          </div>

          {/* Headings */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={editor.isActive('heading', { level: 1 }) ? 'bg-neutral-200 dark:bg-neutral-700' : ''}
            >
              <Heading1 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={editor.isActive('heading', { level: 2 }) ? 'bg-neutral-200 dark:bg-neutral-700' : ''}
            >
              <Heading2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={editor.isActive('heading', { level: 3 }) ? 'bg-neutral-200 dark:bg-neutral-700' : ''}
            >
              <Heading3 className="h-4 w-4" />
            </Button>
          </div>

          {/* Lists */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={editor.isActive('bulletList') ? 'bg-neutral-200 dark:bg-neutral-700' : ''}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={editor.isActive('orderedList') ? 'bg-neutral-200 dark:bg-neutral-700' : ''}
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={editor.isActive('blockquote') ? 'bg-neutral-200 dark:bg-neutral-700' : ''}
            >
              <Quote className="h-4 w-4" />
            </Button>
          </div>

          {/* Links and Media */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLinkDialog(true)}
              className={editor.isActive('link') ? 'bg-neutral-200 dark:bg-neutral-700' : ''}
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
            {editor.isActive('link') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={removeLink}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingImage}
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* Social Features */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={insertMention}
            >
              @
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={insertHashtag}
            >
              #
            </Button>
          </div>

          {/* History */}
          <div className="flex items-center gap-1 ml-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Editor Content */}
      <EditorContent 
        editor={editor} 
        className="min-h-[200px] max-h-[500px] overflow-y-auto"
      />

      {/* Character Count */}
      {maxLength && (
        <div className="px-4 py-2 text-sm text-neutral-500 dark:text-neutral-400 border-t border-neutral-200 dark:border-neutral-700">
          {editor.storage.characterCount.characters()} / {maxLength} characters
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Link Dialog */}
      {showLinkDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Add Link</h3>
            <div className="space-y-4">
              <Input
                label="URL"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
              />
              <Input
                label="Text (optional)"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Link text"
              />
            </div>
            <div className="flex gap-2 mt-6">
              <Button onClick={insertLink} disabled={!linkUrl}>
                Add Link
              </Button>
              <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Mention List Component
class MentionList {
  items: any[];
  command: any;
  editor: any;
  element: HTMLElement;

  constructor({ items, command, editor }: any) {
    this.items = items;
    this.command = command;
    this.editor = editor;
    this.element = document.createElement('div');
    this.element.className = 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg p-2 max-h-48 overflow-y-auto';
    this.render();
  }

  render() {
    this.element.innerHTML = this.items
      .map((item, index) => `
        <div class="px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded cursor-pointer ${index === 0 ? 'bg-neutral-100 dark:bg-neutral-800' : ''}" data-index="${index}">
          ${item.label}
        </div>
      `)
      .join('');

    this.element.querySelectorAll('[data-index]').forEach((item, index) => {
      item.addEventListener('click', () => {
        this.selectItem(index);
      });
    });
  }

  selectItem(index: number) {
    const item = this.items[index];
    this.command({ id: item.id, label: item.label });
  }

  onKeyDown({ event }: any) {
    if (event.key === 'ArrowUp') {
      this.upHandler();
      return true;
    }
    if (event.key === 'ArrowDown') {
      this.downHandler();
      return true;
    }
    if (event.key === 'Enter') {
      this.enterHandler();
      return true;
    }
    return false;
  }

  upHandler() {
    const selectedIndex = this.items.findIndex((_, index) => 
      this.element.querySelector(`[data-index="${index}"]`)?.classList.contains('bg-neutral-100')
    );
    const nextIndex = selectedIndex <= 0 ? this.items.length - 1 : selectedIndex - 1;
    this.selectIndex(nextIndex);
  }

  downHandler() {
    const selectedIndex = this.items.findIndex((_, index) => 
      this.element.querySelector(`[data-index="${index}"]`)?.classList.contains('bg-neutral-100')
    );
    const nextIndex = selectedIndex >= this.items.length - 1 ? 0 : selectedIndex + 1;
    this.selectIndex(nextIndex);
  }

  enterHandler() {
    const selectedIndex = this.items.findIndex((_, index) => 
      this.element.querySelector(`[data-index="${index}"]`)?.classList.contains('bg-neutral-100')
    );
    if (selectedIndex >= 0) {
      this.selectItem(selectedIndex);
    }
  }

  selectIndex(index: number) {
    this.element.querySelectorAll('[data-index]').forEach((item, i) => {
      if (i === index) {
        item.classList.add('bg-neutral-100', 'dark:bg-neutral-800');
      } else {
        item.classList.remove('bg-neutral-100', 'dark:bg-neutral-800');
      }
    });
  }

  updateProps(props: any) {
    this.items = props.items;
    this.command = props.command;
    this.render();
  }

  destroy() {
    this.element.remove();
  }
}

export default RichTextEditor;