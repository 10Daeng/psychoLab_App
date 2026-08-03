"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, ListOrdered, Heading2 } from 'lucide-react';
import { useEffect } from 'react';

interface TipTapEditorProps {
  initialContent: string;
  onChange: (content: string) => void;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap gap-2 p-2 bg-slate-800/80 border-b border-slate-700 rounded-t-xl sticky top-0 z-10 backdrop-blur-md">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-2 rounded-lg hover:bg-slate-700 transition-colors ${editor.isActive('bold') ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400'}`}
        title="Bold"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-2 rounded-lg hover:bg-slate-700 transition-colors ${editor.isActive('italic') ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400'}`}
        title="Italic"
      >
        <Italic className="w-4 h-4" />
      </button>
      <div className="w-px h-6 bg-slate-700 mx-1 self-center" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-2 rounded-lg hover:bg-slate-700 transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400'}`}
        title="Heading 2"
      >
        <Heading2 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded-lg hover:bg-slate-700 transition-colors ${editor.isActive('bulletList') ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400'}`}
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded-lg hover:bg-slate-700 transition-colors ${editor.isActive('orderedList') ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400'}`}
        title="Numbered List"
      >
        <ListOrdered className="w-4 h-4" />
      </button>
    </div>
  );
};

export default function TipTapEditor({ initialContent, onChange }: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm sm:prose-base max-w-none focus:outline-none min-h-[400px] p-6 text-slate-300',
      },
    },
    onUpdate: ({ editor }: { editor: any }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && initialContent !== editor.getHTML()) {
       // Only set content on initial load or if explicitly forced to prevent cursor jumping
       // editor.commands.setContent(initialContent, false); 
    }
  }, [initialContent, editor]);

  return (
    <div className="flex flex-col w-full bg-slate-900/40 border border-slate-700 rounded-xl shadow-inner relative">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
