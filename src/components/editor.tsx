import { Placeholder } from "@tiptap/extensions";
import Image from "@tiptap/extension-image";
import { Markdown } from "@tiptap/markdown";
import type { EditorView } from "@tiptap/pm/view";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useRef } from "react";
import { convex } from "@/lib/convex";
import { type Platform, editorFor } from "@/lib/platforms";
import { api } from "../../convex/_generated/api";
import { EditorToolbar } from "./editor-toolbar";
import { SlashCommand } from "./slash-command";

async function uploadImage(file: File) {
  const postUrl = await convex.mutation(api.images.generateUploadUrl, {});
  const res = await fetch(postUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file });
  if (!res.ok) throw new Error(`upload failed (${res.status})`);
  const { storageId } = await res.json();
  const src = await convex.mutation(api.images.imageUrl, { storageId });
  if (!src) throw new Error("only images up to 10 MB");
  return src;
}

/**
 * A pasted screenshot or a dropped image file arrives as a file, which the
 * editor would ignore: upload it and insert it by URL. Clipboards that also
 * carry text (a web page, Docs, Word) are left to the normal paste, which keeps
 * their text and any linked images.
 */
function insertImageFiles(view: EditorView, data: DataTransfer | null, at?: number) {
  const files = [...(data?.files ?? [])].filter((f) => f.type.startsWith("image/"));
  if (files.length === 0 || data?.getData("text/plain")) return false;
  void (async () => {
    for (const file of files) {
      try {
        const src = await uploadImage(file);
        if (view.isDestroyed) return;
        const image = view.state.schema.nodes.image.create({ src });
        const { tr, doc } = view.state;
        view.dispatch(at === undefined ? tr.replaceSelectionWith(image) : tr.insert(Math.min(at, doc.content.size), image));
      } catch (e) {
        window.alert(`Couldn't add ${file.name}: ${e instanceof Error ? e.message : e}`);
      }
    }
  })();
  return true;
}

export function Editor({
  initialMarkdown,
  onChange,
  platform,
}: {
  initialMarkdown: string;
  onChange: (markdown: string) => void;
  /** The tab picked in the preview; the toolbar and / menu switch to its tools. */
  platform: Platform;
}) {
  // The editor is created once; the / menu reads the current platform through this ref.
  const tools = useRef(editorFor(platform));
  tools.current = editorFor(platform);

  const editor = useEditor({
    immediatelyRender: false, // ProseMirror needs the DOM; mount after hydration
    extensions: [
      // Markdown has no underline, so leave it out rather than lose it on copy.
      StarterKit.configure({ underline: false }),
      Image,
      Markdown,
      Placeholder.configure({ placeholder: "Start writing, or type / for blocks…" }),
      SlashCommand.configure({ tools: () => [...tools.current.tools, ...(tools.current.more ?? [])] }),
    ],
    content: initialMarkdown,
    contentType: "markdown",
    onUpdate: ({ editor }) => onChange(editor.getMarkdown()),
    editorProps: {
      handlePaste: (view, event) => insertImageFiles(view, event.clipboardData),
      handleDrop: (view, event) =>
        insertImageFiles(view, event.dataTransfer, view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos),
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
        <EditorToolbar editor={editor} platform={platform} />
      </div>
      <EditorContent editor={editor} />
    </>
  );
}
