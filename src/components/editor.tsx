import { Placeholder } from "@tiptap/extensions";
import Image from "@tiptap/extension-image";
import { Markdown } from "@tiptap/markdown";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { EditorToolbar } from "./editor-toolbar";
import { SlashCommand } from "./slash-command";

export function Editor({
  initialMarkdown,
  onChange,
}: {
  initialMarkdown: string;
  onChange: (markdown: string) => void;
}) {
  const editor = useEditor({
    immediatelyRender: false, // ProseMirror needs the DOM; mount after hydration
    extensions: [
      // Markdown has no underline, so leave it out rather than lose it on copy.
      StarterKit.configure({ underline: false }),
      Image,
      Markdown,
      Placeholder.configure({ placeholder: "Start writing, or type / for blocks…" }),
      SlashCommand,
    ],
    content: initialMarkdown,
    contentType: "markdown",
    onUpdate: ({ editor }) => onChange(editor.getMarkdown()),
    editorProps: {
      attributes: {
        class: "prose prose-neutral max-w-none min-h-[60vh] focus:outline-none",
        "aria-label": "Article body",
      },
    },
  });

  return (
    <>
      {/* Full-width band like dev.to's; the negative margins cancel the column's padding. */}
      <div className="sticky top-0 z-10 -mx-6 mb-6 border-y bg-background/95 px-4 py-1 backdrop-blur lg:-mx-10 lg:px-8">
        <EditorToolbar editor={editor} />
      </div>
      <EditorContent editor={editor} />
    </>
  );
}
