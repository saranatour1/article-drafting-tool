import type { Editor } from "@tiptap/core";
import { useEditorState } from "@tiptap/react";
import {
  Bold,
  Code,
  EllipsisVertical,
  Heading,
  Heading2,
  Heading3,
  Image,
  Italic,
  Link,
  List,
  ListOrdered,
  type LucideIcon,
  Minus,
  Quote,
  Redo2,
  SquareCode,
  Strikethrough,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Toggle } from "@/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Item = {
  label: string;
  /** TipTap's own keyboard shortcut, shown in the tooltip. */
  keys?: string;
  icon: LucideIcon;
  /** Node or mark name that lights the button up while the cursor is in it. */
  active?: string;
  run: (editor: Editor) => void;
};

const chain = (editor: Editor) => editor.chain().focus();

function link(editor: Editor) {
  if (editor.isActive("link")) return void chain(editor).extendMarkRange("link").unsetLink().run();
  const href = window.prompt("Link URL", "https://");
  if (!href) return;
  if (editor.state.selection.empty) {
    chain(editor).insertContent({ type: "text", text: href, marks: [{ type: "link", attrs: { href } }] }).run();
  } else {
    chain(editor).extendMarkRange("link").setLink({ href }).run();
  }
}

// Like dev.to's H button: text → H2 → H3 → text. The title is the article's H1.
function heading(editor: Editor) {
  if (!editor.isActive("heading")) chain(editor).setNode("heading", { level: 2 }).run();
  else if (editor.isActive("heading", { level: 2 })) chain(editor).setNode("heading", { level: 3 }).run();
  else chain(editor).setParagraph().run();
}

const ITEMS: Item[] = [
  { label: "Bold", keys: "Mod-B", icon: Bold, active: "bold", run: (e) => chain(e).toggleBold().run() },
  { label: "Italic", keys: "Mod-I", icon: Italic, active: "italic", run: (e) => chain(e).toggleItalic().run() },
  { label: "Link", icon: Link, active: "link", run: link },
  { label: "Numbered list", keys: "Mod-Shift-7", icon: ListOrdered, active: "orderedList", run: (e) => chain(e).toggleOrderedList().run() },
  { label: "Bullet list", keys: "Mod-Shift-8", icon: List, active: "bulletList", run: (e) => chain(e).toggleBulletList().run() },
  { label: "Heading: text → H2 → H3", icon: Heading, active: "heading", run: heading },
  { label: "Quote", keys: "Mod-Shift-B", icon: Quote, active: "blockquote", run: (e) => chain(e).toggleBlockquote().run() },
  { label: "Inline code", keys: "Mod-E", icon: Code, active: "code", run: (e) => chain(e).toggleCode().run() },
  { label: "Code block", keys: "Mod-Alt-C", icon: SquareCode, active: "codeBlock", run: (e) => chain(e).toggleCodeBlock().run() },
  {
    label: "Image from a URL",
    icon: Image,
    run: (e) => {
      const src = window.prompt("Image URL");
      if (src) chain(e).setImage({ src }).run();
    },
  },
];

const MORE: Item[] = [
  { label: "Strikethrough", keys: "Mod-Shift-S", icon: Strikethrough, run: (e) => chain(e).toggleStrike().run() },
  { label: "Divider", icon: Minus, run: (e) => chain(e).setHorizontalRule().run() },
  { label: "Undo", keys: "Mod-Z", icon: Undo2, run: (e) => chain(e).undo().run() },
  { label: "Redo", keys: "Mod-Shift-Z", icon: Redo2, run: (e) => chain(e).redo().run() },
];

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
const shortcut = (keys: string) =>
  isMac
    ? keys.replace("Mod", "⌘").replace("Shift", "⇧").replace("Alt", "⌥").replaceAll("-", "")
    : keys.replace("Mod", "Ctrl").replaceAll("-", "+");

/** dev.to-style formatting bar. Buttons light up for whatever is under the cursor. */
export function EditorToolbar({ editor }: { editor: Editor | null }) {
  const active = useEditorState({
    editor,
    selector: ({ editor }) =>
      editor && {
        ...Object.fromEntries(ITEMS.filter((i) => i.active).map((i) => [i.active, editor.isActive(i.active!)])),
        h2: editor.isActive("heading", { level: 2 }),
        h3: editor.isActive("heading", { level: 3 }),
      },
  });
  const icon = (item: Item) =>
    item.run === heading && active?.h2 ? Heading2 : item.run === heading && active?.h3 ? Heading3 : item.icon;

  return (
    <TooltipProvider delayDuration={300}>
      <div role="toolbar" aria-label="Formatting" className="flex items-center gap-0.5">
        {ITEMS.map((item) => {
          const Icon = icon(item);
          return (
            <Tooltip key={item.label}>
              <TooltipTrigger asChild>
                <Toggle
                  size="lg"
                  aria-label={item.label}
                  pressed={Boolean(item.active && active?.[item.active])}
                  onClick={() => editor && item.run(editor)}
                  disabled={!editor}
                >
                  <Icon />
                </Toggle>
              </TooltipTrigger>
              <TooltipContent>
                {item.label}
                {item.keys && <kbd className="ml-2 font-sans opacity-70">{shortcut(item.keys)}</kbd>}
              </TooltipContent>
            </Tooltip>
          );
        })}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-lg" aria-label="More formatting" className="ml-auto" disabled={!editor}>
              <EllipsisVertical />
            </Button>
          </DropdownMenuTrigger>
          {/* Return focus to the text, not the ⋮ button, so typing carries on. */}
          <DropdownMenuContent
            align="end"
            onCloseAutoFocus={(e) => {
              e.preventDefault();
              editor?.commands.focus();
            }}
          >
            {MORE.map((item) => (
              <DropdownMenuItem key={item.label} onSelect={() => editor && item.run(editor)}>
                <item.icon />
                {item.label}
                {item.keys && <DropdownMenuShortcut>{shortcut(item.keys)}</DropdownMenuShortcut>}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="font-normal text-muted-foreground">
              Type / in the text for more blocks
            </DropdownMenuLabel>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TooltipProvider>
  );
}
