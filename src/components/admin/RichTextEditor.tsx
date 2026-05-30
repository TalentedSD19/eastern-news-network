"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { ResizableImage } from "./ResizableImage";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";
import {
  Bold, Italic, Strikethrough, Heading2, Heading3, Heading4,
  List, ListOrdered, Quote, Code, FileCode, Minus,
  Link2, Link2Off, Undo2, Redo2,
} from "lucide-react";

interface Props {
  value: string;
  onChange: (html: string) => void;
  editorRef?: React.MutableRefObject<Editor | null>;
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        active
          ? "bg-brand-red text-white"
          : "text-gray-600 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="w-px h-5 bg-gray-300 mx-1 self-center" />;
}

export default function RichTextEditor({ value, onChange, editorRef }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      ResizableImage,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Write your article here…" }),
    ],
    content: value,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none min-h-[480px] p-5 focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  useEffect(() => {
    if (editorRef) editorRef.current = editor ?? null;
  }, [editor, editorRef]);

  if (!editor) return null;

  function handleLink() {
    if (editor!.isActive("link")) {
      editor!.chain().focus().unsetLink().run();
    } else {
      const url = window.prompt("Enter URL:");
      if (url) {
        try {
          const parsed = new URL(url);
          if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return;
          editor!.chain().focus().setLink({ href: parsed.href, target: "_blank", rel: "noopener noreferrer" }).run();
        } catch {
          // invalid URL — ignore
        }
      }
    }
  }

  return (
    <div className="border rounded-lg overflow-hidden shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-2 border-b bg-gray-50">
        {/* History */}
        <ToolbarButton
          title="Undo"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo2 size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="Redo"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo2 size={15} />
        </ToolbarButton>

        <Divider />

        {/* Headings */}
        <ToolbarButton
          title="Heading 2"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
        >
          <Heading2 size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="Heading 3"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
        >
          <Heading3 size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="Heading 4"
          onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
          active={editor.isActive("heading", { level: 4 })}
        >
          <Heading4 size={15} />
        </ToolbarButton>

        <Divider />

        {/* Inline formatting */}
        <ToolbarButton
          title="Bold"
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
        >
          <Bold size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="Italic"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
        >
          <Italic size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="Strikethrough"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
        >
          <Strikethrough size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="Inline Code"
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive("code")}
        >
          <Code size={15} />
        </ToolbarButton>

        <Divider />

        {/* Lists */}
        <ToolbarButton
          title="Bullet List"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
        >
          <List size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="Ordered List"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
        >
          <ListOrdered size={15} />
        </ToolbarButton>

        <Divider />

        {/* Block elements */}
        <ToolbarButton
          title="Blockquote"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
        >
          <Quote size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="Code Block"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive("codeBlock")}
        >
          <FileCode size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="Horizontal Rule"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus size={15} />
        </ToolbarButton>

        <Divider />

        {/* Link */}
        <ToolbarButton
          title={editor.isActive("link") ? "Remove Link" : "Insert Link"}
          onClick={handleLink}
          active={editor.isActive("link")}
        >
          {editor.isActive("link") ? <Link2Off size={15} /> : <Link2 size={15} />}
        </ToolbarButton>
      </div>

      {/* Editor area */}
      <EditorContent editor={editor} className="bg-white" />
    </div>
  );
}
