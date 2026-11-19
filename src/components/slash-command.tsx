import { type ChainedCommands, type Editor, Extension } from "@tiptap/core";
import { ReactRenderer } from "@tiptap/react";
import Suggestion, { type SuggestionProps } from "@tiptap/suggestion";
import {
  Code,
  Heading2,
  Heading3,
  Image,
  List,
  ListOrdered,
  type LucideIcon,
  Minus,
  Quote,
} from "lucide-react";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import type { ToolId } from "@/lib/platforms";
import { cn } from "@/lib/utils";

type Command = {
  title: string;
  icon: LucideIcon;
  /** Offered when the current platform's editor has any of these tools. */
  needs: ToolId[];
  run: (chain: ChainedCommands) => ChainedCommands;
};

// No "Heading 1": the title is the article's H1 on every platform.
const COMMANDS: Command[] = [
  { title: "Heading", icon: Heading2, needs: ["heading", "style"], run: (c) => c.setNode("heading", { level: 2 }) },
  { title: "Subheading", icon: Heading3, needs: ["heading", "style"], run: (c) => c.setNode("heading", { level: 3 }) },
  { title: "Bullet list", icon: List, needs: ["bulletList"], run: (c) => c.toggleBulletList() },
  { title: "Numbered list", icon: ListOrdered, needs: ["orderedList"], run: (c) => c.toggleOrderedList() },
  { title: "Quote", icon: Quote, needs: ["quote"], run: (c) => c.toggleBlockquote() },
  { title: "Code block", icon: Code, needs: ["codeBlock"], run: (c) => c.toggleCodeBlock() },
  { title: "Divider", icon: Minus, needs: ["divider"], run: (c) => c.setHorizontalRule() },
  {
    title: "Image",
    icon: Image,
    needs: ["image"],
    run: (c) => {
      const src = window.prompt("Image URL");
      return src ? c.setImage({ src }) : c;
    },
  },
];

type ListHandle = { onKeyDown: (event: KeyboardEvent) => boolean };

const CommandList = forwardRef<ListHandle, SuggestionProps<Command>>(
  ({ items, command, clientRect }, ref) => {
    const [active, setActive] = useState(0);
    useEffect(() => setActive(0), [items]);

    useImperativeHandle(ref, () => ({
      onKeyDown: (event) => {
        if (!items.length) return false;
        if (event.key === "ArrowDown") setActive((i) => (i + 1) % items.length);
        else if (event.key === "ArrowUp") setActive((i) => (i - 1 + items.length) % items.length);
        else if (event.key === "Enter") command(items[active]);
        else return false;
        return true;
      },
    }));

    const rect = clientRect?.();
    if (!rect || !items.length) return null;
    return (
      <div
        role="listbox"
        aria-label="Insert block"
        style={{ position: "fixed", left: rect.left, top: rect.bottom + 6 }}
        className="z-50 w-56 rounded-lg border bg-popover p-1 text-popover-foreground shadow-md"
      >
        {items.map((item, i) => (
          <button
            key={item.title}
            type="button"
            role="option"
            aria-selected={i === active}
            onMouseEnter={() => setActive(i)}
            onMouseDown={(e) => {
              e.preventDefault(); // keep editor focus
              command(item);
            }}
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm",
              i === active && "bg-accent text-accent-foreground",
            )}
          >
            <item.icon className="size-4 text-muted-foreground" />
            {item.title}
          </button>
        ))}
      </div>
    );
  },
);

/** Type "/" anywhere to insert a block, from the tools the current platform has. */
export const SlashCommand = Extension.create<{ tools: () => ToolId[] }>({
  name: "slashCommand",
  addOptions: () => ({ tools: () => [] }),
  addProseMirrorPlugins() {
    return [
      Suggestion<Command>({
        editor: this.editor as Editor,
        char: "/",
        items: ({ query }) => {
          const tools = this.options.tools();
          return COMMANDS.filter(
            (c) =>
              c.needs.some((t) => tools.includes(t)) &&
              c.title.toLowerCase().includes(query.toLowerCase()),
          );
        },
        command: ({ editor, range, props }) =>
          props.run(editor.chain().focus().deleteRange(range)).run(),
        render: () => {
          let renderer: ReactRenderer<ListHandle, SuggestionProps<Command>> | undefined;
          const close = () => {
            renderer?.element.remove();
            renderer?.destroy();
            renderer = undefined;
          };
          return {
            onStart: (props) => {
              renderer = new ReactRenderer(CommandList, { props, editor: props.editor });
              document.body.appendChild(renderer.element);
            },
            onUpdate: (props) => renderer?.updateProps(props),
            onKeyDown: ({ event }) => {
              if (event.key === "Escape") {
                close();
                return true;
              }
              return renderer?.ref?.onKeyDown(event) ?? false;
            },
            onExit: close,
          };
        },
      }),
    ];
  },
});
