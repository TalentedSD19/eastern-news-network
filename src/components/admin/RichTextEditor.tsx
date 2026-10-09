"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import type { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { ResizableImage } from "./ResizableImage";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";
import {
  Bold, Italic, Strikethrough,
  List, ListOrdered, Quote, Minus,
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
      aria-label={title}
      aria-pressed={active}
      className={`p-1.5 rounded transition-colors ${
        active
          ? "bg-brand-accent text-white"
          : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="w-px h-5 bg-gray-300 dark:bg-white/15 mx-1 self-center" />;
}

export default function RichTextEditor({ value, onChange, editorRef }: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      // StarterKit v3 already bundles the link extension; configure it here instead of adding a duplicate.
      StarterKit.configure({ link: { openOnClick: false } }),
      ResizableImage,
      Placeholder.configure({ placeholder: "Write your article here…" }),
    ],
    content: value,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm dark:prose-invert max-w-none min-h-[480px] p-5 focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      // Syncing from props isn't an edit — emitting here would mark a freshly opened article as changed.
      editor.commands.setContent(value, { emitUpdate: false });
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
      const input = window.prompt("Paste the web address to link to (for example bbc.com/news):")?.trim();
      if (input) {
        try {
          // People often paste "bbc.com/news" without the https:// part.
          const parsed = new URL(/^[a-z][a-z0-9+.-]*:/i.test(input) ? input : `https://${input}`);
          if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return;
          editor!.chain().focus().setLink({ href: parsed.href, target: "_blank", rel: "noopener noreferrer" }).run();
        } catch {
          // invalid URL — ignore
        }
      }
    }
  }

  return (
    <div className="border dark:border-white/10 rounded-lg overflow-hidden shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-2 border-b dark:border-white/10 bg-gray-50 dark:bg-white/5">
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
          title="Heading — starts a new section"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
        >
          <span className="px-1 text-xs font-bold">Heading</span>
        </ToolbarButton>
        <ToolbarButton
          title="Subheading — a smaller heading inside a section"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
        >
          <span className="px-1 text-xs font-semibold">Subheading</span>
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
          title="Strike through"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
        >
          <Strikethrough size={15} />
        </ToolbarButton>

        <Divider />

        {/* Lists */}
        <ToolbarButton
          title="Bullet list"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
        >
          <List size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="Numbered list"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
        >
          <ListOrdered size={15} />
        </ToolbarButton>

        <Divider />

        {/* Block elements */}
        <ToolbarButton
          title="Quote"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
        >
          <Quote size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="Divider line"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus size={15} />
        </ToolbarButton>

        <Divider />

        {/* Link */}
        <ToolbarButton
          title={editor.isActive("link") ? "Remove link" : "Add a link (select some text first)"}
          onClick={handleLink}
          active={editor.isActive("link")}
        >
          {editor.isActive("link") ? <Link2Off size={15} /> : <Link2 size={15} />}
        </ToolbarButton>
      </div>

      {/* Editor area */}
      <EditorContent editor={editor} className="bg-white dark:bg-neutral-900" />
    </div>
  );
}
