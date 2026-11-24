import type { Editor } from "@tiptap/core";
import { useEditorState } from "@tiptap/react";
import {
  Bold,
  ChevronDown,
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
import { MicButton } from "@/components/mic-button";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuShortcut,
  MenuTrigger,
} from "@/components/ui/menu";
import { Toggle } from "@/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { type Platform, type ToolId, editorFor } from "@/lib/platforms";

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

const TOOLS: Record<Exclude<ToolId, "style">, Item> = {
  bold: { label: "Bold", keys: "Mod-B", icon: Bold, active: "bold", run: (e) => chain(e).toggleBold().run() },
  italic: { label: "Italic", keys: "Mod-I", icon: Italic, active: "italic", run: (e) => chain(e).toggleItalic().run() },
  strike: { label: "Strikethrough", keys: "Mod-Shift-S", icon: Strikethrough, active: "strike", run: (e) => chain(e).toggleStrike().run() },
  link: { label: "Link", icon: Link, active: "link", run: link },
  orderedList: { label: "Numbered list", keys: "Mod-Shift-7", icon: ListOrdered, active: "orderedList", run: (e) => chain(e).toggleOrderedList().run() },
  bulletList: { label: "Bullet list", keys: "Mod-Shift-8", icon: List, active: "bulletList", run: (e) => chain(e).toggleBulletList().run() },
  heading: { label: "Heading: text → H2 → H3", icon: Heading, active: "heading", run: heading },
  quote: { label: "Quote", keys: "Mod-Shift-B", icon: Quote, active: "blockquote", run: (e) => chain(e).toggleBlockquote().run() },
  code: { label: "Inline code", keys: "Mod-E", icon: Code, active: "code", run: (e) => chain(e).toggleCode().run() },
  codeBlock: { label: "Code block", keys: "Mod-Alt-C", icon: SquareCode, active: "codeBlock", run: (e) => chain(e).toggleCodeBlock().run() },
  divider: { label: "Divider", icon: Minus, run: (e) => chain(e).setHorizontalRule().run() },
  image: {
    label: "Image from a URL",
    icon: Image,
    run: (e) => {
      const src = window.prompt("Image URL");
      if (src) chain(e).setImage({ src }).run();
    },
  },
};

const HISTORY: Item[] = [
  { label: "Undo", keys: "Mod-Z", icon: Undo2, run: (e) => chain(e).undo().run() },
  { label: "Redo", keys: "Mod-Shift-Z", icon: Redo2, run: (e) => chain(e).redo().run() },
];

// LinkedIn-style Style menu. Heading and Subheading are H2 and H3, the two sizes every site keeps.
const STYLES = [
  { value: "normal", label: "Normal", run: (e: Editor) => chain(e).setParagraph().run() },
  { value: "heading", label: "Heading", run: (e: Editor) => chain(e).setNode("heading", { level: 2 }).run() },
  { value: "subheading", label: "Subheading", run: (e: Editor) => chain(e).setNode("heading", { level: 3 }).run() },
];

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
const shortcut = (keys: string) =>
  isMac
    ? keys.replace("Mod", "⌘").replace("Shift", "⇧").replace("Alt", "⌥").replaceAll("-", "")
    : keys.replace("Mod", "Ctrl").replaceAll("-", "+");

// Return focus to the text when a menu closes, not to its button, so typing carries on.
// A closed menu hands focus back to the text, not to its button.
const refocus = (editor: Editor | null) => () => {
  editor?.commands.focus();
  return false;
};

/** The selected platform's formatting bar. Buttons light up for whatever is under the cursor. */
export function EditorToolbar({
  editor,
  platform,
  dictate,
}: {
  editor: Editor | null;
  platform: Platform;
  /** Start the mic as the page opens: Speak, when Preferences says not to go full screen. */
  dictate?: boolean;
}) {
  const spec = editorFor(platform);
  const active = useEditorState({
    editor,
    selector: ({ editor }) =>
      editor && {
        ...Object.fromEntries(
          Object.values(TOOLS)
            .filter((i) => i.active)
            .map((i) => [i.active, editor.isActive(i.active!)]),
        ),
        h2: editor.isActive("heading", { level: 2 }),
        h3: editor.isActive("heading", { level: 3 }),
      },
  });
  const style = active?.h2 ? "heading" : active?.h3 ? "subheading" : "normal";
  const styles = spec.bodyStyle ? [{ ...STYLES[0], label: spec.bodyStyle }, ...STYLES.slice(1)] : STYLES;

  return (
    <TooltipProvider delay={300}>
      <div role="toolbar" aria-label={`${platform.label} formatting`} className="flex items-center gap-0.5">
        {spec.tools.map((id) => {
          if (id === "style") {
            return (
              <Menu key={id}>
                <MenuTrigger
                  disabled={!editor}
                  render={<Button variant="ghost" size="lg" className="mr-1 font-semibold" />}
                >
                  {spec.bodyStyle ? styles.find((s) => s.value === style)!.label : "Style"} <ChevronDown />
                </MenuTrigger>
                <MenuPopup align="start" finalFocus={refocus(editor)}>
                  <MenuRadioGroup value={style}>
                    {styles.map((s) => (
                      <MenuRadioItem key={s.value} value={s.value} closeOnClick onClick={() => editor && s.run(editor)}>
                        {s.label}
                      </MenuRadioItem>
                    ))}
                  </MenuRadioGroup>
                </MenuPopup>
              </Menu>
            );
          }
          const item = TOOLS[id];
          const Icon = id === "heading" && active?.h2 ? Heading2 : id === "heading" && active?.h3 ? Heading3 : item.icon;
          return (
            <Tooltip key={id}>
              <TooltipTrigger
                render={
                  <Toggle
                    size="lg"
                    aria-label={item.label}
                    pressed={Boolean(item.active && active?.[item.active])}
                    onClick={() => editor && item.run(editor)}
                    disabled={!editor}
                  />
                }
              >
                <Icon />
              </TooltipTrigger>
              <TooltipContent>
                {item.label}
                {item.keys && <Kbd className="ml-2">{shortcut(item.keys)}</Kbd>}
              </TooltipContent>
            </Tooltip>
          );
        })}
        <span className="ml-auto pr-1 text-xs whitespace-nowrap text-muted-foreground">{platform.label} tools</span>
        {/* Not one of the platform's tools: no site has a mic, so it sits outside spec.tools. */}
        <Tooltip>
          <TooltipTrigger
            render={
              <MicButton
                size="lg"
                autoStart={dictate}
                disabled={!editor}
                onText={(text) => editor?.chain().focus().insertContent(text + " ").run()}
              />
            }
          />
          <TooltipContent>Dictate</TooltipContent>
        </Tooltip>
        <Menu>
          <MenuTrigger
            disabled={!editor}
            render={<Button variant="ghost" size="icon-lg" aria-label="More formatting" />}
          >
            <EllipsisVertical />
          </MenuTrigger>
          <MenuPopup align="end" finalFocus={refocus(editor)}>
            {[...(spec.more ?? []).map((id) => TOOLS[id as Exclude<ToolId, "style">]), ...HISTORY].map((item) => (
              <MenuItem key={item.label} onClick={() => editor && item.run(editor)}>
                <item.icon />
                {item.label}
                {item.keys && <MenuShortcut>{shortcut(item.keys)}</MenuShortcut>}
              </MenuItem>
            ))}
            <MenuSeparator />
            <p className="px-2 py-1.5 text-xs text-muted-foreground">Type / in the text for more blocks</p>
          </MenuPopup>
        </Menu>
      </div>
    </TooltipProvider>
  );
}
