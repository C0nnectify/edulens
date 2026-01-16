/**
 * TipTap Editor Component
 * Rich text editor for SOP content
 */
'use client';

import { useEditor, EditorContent, Content } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { FontFamily } from '@tiptap/extension-font-family';
import TextAlign from '@tiptap/extension-text-align';
import CharacterCount from '@tiptap/extension-character-count';
import { Extension } from '@tiptap/core';
import { Button } from '@/components/ui/button';
import { Bold, Italic, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-react';
import { useEffect, useImperativeHandle, forwardRef, useRef } from 'react';

// Extend TextStyle to include fontSize attribute
declare module '@tiptap/extension-text-style' {
  interface TextStyleOptions {
    types: string[];
  }
}

const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return {
      types: ['textStyle'],
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize?.replace(/['"]+/g, ''),
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize }).run();
      },
      unsetFontSize: () => ({ chain }) => {
        return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run();
      },
    };
  },
});

const LineHeight = Extension.create({
  name: 'lineHeight',
  addOptions() {
    return {
      types: ['paragraph', 'heading'],
      defaultLineHeight: '1.5',
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: this.options.defaultLineHeight,
            parseHTML: element => element.style.lineHeight || this.options.defaultLineHeight,
            renderHTML: attributes => {
              if (!attributes.lineHeight) {
                return {};
              }
              return {
                style: `line-height: ${attributes.lineHeight}`,
              };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setLineHeight: (lineHeight: string) => ({ commands }) => {
        return this.options.types.every((type: string) => commands.updateAttributes(type, { lineHeight }));
      },
      unsetLineHeight: () => ({ commands }) => {
        return this.options.types.every((type: string) => commands.resetAttributes(type, 'lineHeight'));
      },
    };
  },
});

interface EditorProps {
  initialContent?: Record<string, unknown>;
  onUpdate?: (content: { json: Record<string, unknown>; html: string }) => void;
}

export interface EditorHandle {
  getJSON: () => Record<string, unknown>;
  getHTML: () => string;
  setContent: (content: Record<string, unknown> | string) => void;
  replaceSelection: (text: string) => void;
  getSelectedText: () => string;
  getSelectionRange: () => { from: number; to: number } | null;
  replaceSelectionAt: (
    range: { from: number; to: number },
    content: string
  ) => void;
}

const Editor = forwardRef<EditorHandle, EditorProps>(
  ({ initialContent, onUpdate }, ref) => {
    const lastSelectionRef = useRef<{ from: number; to: number } | null>(null);
    const editor = useEditor({
      immediatelyRender: false,
      extensions: [
        TextStyle,
        FontFamily,
        FontSize,
        CharacterCount,
        LineHeight.configure({
          defaultLineHeight: '1.5',
        }),
        TextAlign.extend({
          addGlobalAttributes() {
            return [
              {
                types: ['heading', 'paragraph'],
                attributes: {
                  textAlign: {
                    default: null,
                    parseHTML: element => element.style.textAlign || null,
                    renderHTML: attributes => {
                      if (!attributes.textAlign) {
                        return {};
                      }
                      return { style: `text-align: ${attributes.textAlign}` };
                    },
                  },
                },
              },
            ];
          },
        }).configure({
          types: ['heading', 'paragraph'],
          defaultAlignment: 'justify',
        }),
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3],
          },
          bulletList: false,
          orderedList: false,
          blockquote: false,
          codeBlock: false,
        }),
      ],
      content: initialContent || {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1, textAlign: 'center', lineHeight: '1.5' },
            content: [
              { 
                type: 'text', 
                text: 'SOP Title',
                marks: [{ type: 'textStyle', attrs: { fontSize: '12pt', fontFamily: '"Times New Roman", serif' } }]
              },
            ],
          },
          {
            type: 'paragraph',
            attrs: { textAlign: 'justify', lineHeight: '1.5' },
            content: [
              {
                type: 'text',
                text: 'Your generated SOP will appear here...',
                marks: [{ type: 'textStyle', attrs: { fontSize: '12pt', fontFamily: '"Times New Roman", serif' } }]
              },
            ],
          },
        ],
      },
      editorProps: {
        attributes: {
          class: 'focus:outline-none',
          style: 'font-size: 12pt; font-family: "Times New Roman", serif; line-height: 1.5;',
        },
      },
      onUpdate: ({ editor }: { editor: { getJSON: () => unknown; getHTML: () => string } }) => {
        if (onUpdate) {
          onUpdate({
            json: editor.getJSON() as Record<string, unknown>,
            html: editor.getHTML(),
          });
        }
      },
    });

    // Track selection updates so we can preserve range across focus changes
    useEffect(() => {
      if (!editor) return;
      const onSelUpdate = () => {
        const { from, to } = editor.state.selection || { from: 0, to: 0 };
        // Store only non-empty selections
        if (from !== to) {
          lastSelectionRef.current = { from, to };
        }
      };
      editor.on('selectionUpdate', onSelUpdate);
      return () => {
        editor.off('selectionUpdate', onSelUpdate);
      };
    }, [editor]);

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
      getJSON: () => {
        return (editor?.getJSON() || {}) as Record<string, unknown>;
      },
      getHTML: () => {
        return editor?.getHTML() || '';
      },
      setContent: (content: Record<string, unknown> | string) => {
        // TipTap accepts HTML string or JSON content
        editor?.commands.setContent(content as Content);
      },
      replaceSelection: (text: string) => {
        if (editor?.state.selection.empty) {
          // No selection, insert at cursor
          editor?.commands.insertContent(text);
        } else {
          // Replace selection
          editor?.commands.insertContent(text);
        }
      },
      getSelectedText: () => {
        const { from, to } = editor?.state.selection || { from: 0, to: 0 };
        return editor?.state.doc.textBetween(from, to, ' ') || '';
      },
      getSelectionRange: () => {
        // Prefer last non-empty selection captured
        if (lastSelectionRef.current) return lastSelectionRef.current;
        const { from, to } = editor?.state.selection || { from: 0, to: 0 };
        return from !== to ? { from, to } : null;
      },
      replaceSelectionAt: (range: { from: number; to: number }, content: string) => {
        if (!editor) return;
        // Restore selection and insert content
        editor.chain().setTextSelection(range).run();
        editor.commands.insertContent(content as Content);
        // Reselect the inserted content if possible
        const approxLen = typeof content === 'string' ? content.replace(/<[^>]+>/g, '').length : 0;
        const from = range.from;
        const to = approxLen > 0 ? from + approxLen : range.to;
        editor.chain().setTextSelection({ from, to }).run();
        // Update last selection
        lastSelectionRef.current = { from, to };
      },
    }));

    useEffect(() => {
      return () => {
        editor?.destroy();
      };
    }, [editor]);

    if (!editor) {
      return <div>Loading editor...</div>;
    }

    return (
      <div className="h-full flex flex-col">
        {/* Toolbar - Sticky on scroll */}
        <div className="border-b bg-white/90 p-2 flex gap-2 flex-wrap items-center shadow-sm lg:sticky lg:top-0 lg:z-10">
          <label className="text-xs text-gray-600">Font</label>
          <select
            className="text-sm border rounded px-2 py-1"
            onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
            defaultValue='"Times New Roman", serif'
          >
            <option value='"Times New Roman", serif'>Times New Roman</option>
            <option value='Arial, sans-serif'>Arial</option>
            <option value="Georgia, serif">Georgia</option>
            <option value='"Merriweather", serif'>Merriweather</option>
            <option value='Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji"'>Inter</option>
          </select>
          
          <label className="text-xs text-gray-600 ml-2">Size</label>
          <select
            className="text-sm border rounded px-2 py-1"
            onChange={(e) => {
              const size = e.target.value;
              if (size) {
                editor.chain().focus().setFontSize(size).run();
              } else {
                editor.chain().focus().unsetFontSize().run();
              }
            }}
            defaultValue="12pt"
          >
            <option value="10pt">10 pt</option>
            <option value="11pt">11 pt</option>
            <option value="12pt">12 pt</option>
            <option value="14pt">14 pt</option>
            <option value="16pt">16 pt</option>
            <option value="18pt">18 pt</option>
            <option value="20pt">20 pt</option>
            <option value="24pt">24 pt</option>
            <option value="28pt">28 pt</option>
            <option value="32pt">32 pt</option>
            <option value="36pt">36 pt</option>
          </select>
          
          <label className="text-xs text-gray-600 ml-2">Line Spacing</label>
          <select
            className="text-sm border rounded px-2 py-1"
            onChange={(e) => {
              const lineHeight = e.target.value;
              if (lineHeight) {
                editor.chain().focus().setLineHeight(lineHeight).run();
              }
            }}
            defaultValue="1.5"
          >
            <option value="1">Single</option>
            <option value="1.15">1.15</option>
            <option value="1.5">1.5</option>
            <option value="2">Double</option>
            <option value="2.5">2.5</option>
            <option value="3">Triple</option>
          </select>
          
          <div className="h-6 w-px bg-gray-300 mx-1"></div>
          
          {/* Text Formatting */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'bg-gray-200' : ''}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'bg-gray-200' : ''}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
          
          <div className="h-6 w-px bg-gray-300 mx-1"></div>
          
          {/* Heading Styles */}
          <label className="text-xs text-gray-600">Style</label>
          <select
            className="text-sm border rounded px-2 py-1 min-w-[120px]"
            value={
              editor.isActive('heading', { level: 1 }) ? 'h1' :
              editor.isActive('heading', { level: 2 }) ? 'h2' :
              editor.isActive('heading', { level: 3 }) ? 'h3' :
              'paragraph'
            }
            onChange={(e) => {
              const value = e.target.value;
              if (value === 'h1') {
                editor.chain().focus().toggleHeading({ level: 1 }).run();
              } else if (value === 'h2') {
                editor.chain().focus().toggleHeading({ level: 2 }).run();
              } else if (value === 'h3') {
                editor.chain().focus().toggleHeading({ level: 3 }).run();
              } else {
                editor.chain().focus().setParagraph().run();
              }
            }}
          >
            <option value="paragraph">Normal Text</option>
            <option value="h1">Title</option>
            <option value="h2">Heading 1</option>
            <option value="h3">Heading 2</option>
          </select>
          
          <div className="h-6 w-px bg-gray-300 mx-1"></div>
          
          {/* Text Alignment */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : ''}
            title="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : ''}
            title="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : ''}
            title="Align Right"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={editor.isActive({ textAlign: 'justify' }) ? 'bg-gray-200' : ''}
            title="Justify"
          >
            <AlignJustify className="h-4 w-4" />
          </Button>

        {/* Word Count Display */}
        <div className="ml-auto hidden md:flex items-center gap-3 px-4 py-1.5 bg-white rounded-md border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Words</span>
            <span className="text-sm font-bold text-blue-600">{editor.storage.characterCount.words()}</span>
          </div>
          <div className="h-4 w-px bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Characters</span>
            <span className="text-sm font-bold text-gray-700">{editor.storage.characterCount.characters()}</span>
          </div>
        </div>
        </div>

        {/* Editor content - Page Layout with pagination */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4 sm:p-6 lg:p-8 editor-content">
          <style jsx global>{`
            .editor-pages-container {
              width: 8.5in;
              margin: 0 auto;
            }
            
            .editor-page {
              width: 8.5in;
              min-height: 11in;
              padding: 1in;
              margin-bottom: 0.5in;
              background: white;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              box-sizing: border-box;
              position: relative;
            }

            @media (max-width: 768px) {
              .editor-pages-container {
                width: 100%;
              }

              .editor-page {
                width: 100%;
                min-height: auto;
                padding: 1rem;
                margin-bottom: 1rem;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
              }

              .ProseMirror {
                min-height: 60vh;
              }
            }
            
            .editor-page:last-child {
              margin-bottom: 0;
            }
            
            .ProseMirror {
              width: 100%;
              min-height: 9in;
              outline: none;
            }
            
            .ProseMirror:focus {
              outline: none;
            }
            
            .ProseMirror h1 {
              font-size: 16pt;
              font-weight: bold;
              margin: 0 0 18pt 0;
              line-height: 1.5;
            }
            
            .ProseMirror h2 {
              font-size: 14pt;
              font-weight: bold;
              margin: 14pt 0 8pt 0;
              line-height: 1.5;
            }
            
            .ProseMirror h3 {
              font-size: 12pt;
              font-weight: bold;
              margin: 12pt 0 6pt 0;
              line-height: 1.5;
            }
            
            .ProseMirror p {
              font-size: 12pt;
              margin: 0 0 12pt 0;
              line-height: 1.5;
              text-align: justify;
            }
            
            .ProseMirror h1[style*="text-align: center"] {
              text-align: center !important;
            }
            
            .ProseMirror h1[style*="text-align: left"] {
              text-align: left !important;
            }
            
            .ProseMirror h1[style*="text-align: right"] {
              text-align: right !important;
            }
            
            .ProseMirror p[style*="text-align: left"] {
              text-align: left !important;
            }
            
            .ProseMirror p[style*="text-align: center"] {
              text-align: center !important;
            }
            
            .ProseMirror p[style*="text-align: right"] {
              text-align: right !important;
            }
            
            .ProseMirror p[style*="text-align: justify"] {
              text-align: justify !important;
            }
            
            .ProseMirror [style*="line-height"] {
              line-height: inherit;
            }
            
            /* Print styles for PDF generation */
            @media print {
              @page {
                size: letter portrait;
                margin: 0;
              }
              
              html, body {
                width: 8.5in;
                height: 11in;
                margin: 0;
                padding: 0;
              }
              
              body * {
                visibility: hidden;
              }
              
              .editor-pages-container,
              .editor-pages-container * {
                visibility: visible;
              }
              
              .editor-pages-container {
                position: absolute;
                left: 0;
                top: 0;
                width: 8.5in;
                margin: 0;
              }
              
              .editor-page {
                width: 8.5in;
                min-height: 11in;
                padding: 1in;
                margin: 0;
                box-shadow: none;
                page-break-after: always;
                background: white;
                box-sizing: border-box;
              }
              
              .editor-page:last-child {
                page-break-after: auto;
              }
              
              /* Ensure proper font rendering in print */
              .ProseMirror {
                font-family: "Times New Roman", serif !important;
              }
            }
          `}</style>
          <div className="editor-pages-container">
            <div className="editor-page">
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>
      </div>
    );
  }
);

Editor.displayName = 'Editor';

export default Editor;
