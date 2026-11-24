import { track } from "@databuddy/sdk";
import { Check, Copy, Download, Moon, Plus, Sun } from "lucide-react";
import { type CSSProperties, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import { download } from "@/lib/export";
import { type Platform, type RenderOptions, renderForPlatform } from "@/lib/platforms";
import { PlatformMark } from "./bits";

type Props = { title: string; markdown: string; tags: string[]; author: string; options: RenderOptions };

// dev.to colors each tag from its own database; a stable hue per name stands in.
const tagHue = (tag: string) => [...tag].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);

/** One tab per destination the draft is headed to; Add opens the destinations dialog. */
export function Preview({
  platforms,
  platformId,
  onPlatformChange,
  onAdd,
  ...props
}: Props & { platforms: Platform[]; platformId: string; onPlatformChange: (id: string) => void; onAdd: () => void }) {
  return (
    <Tabs value={platformId} onValueChange={onPlatformChange} className="gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Wraps when a draft goes to many places. */}
        <TabsList aria-label="Preview as" className="flex-wrap justify-start">
          {platforms.map((p) => (
            <TabsTab key={p.id} value={p.id} className="grow-0 gap-1.5">
              <PlatformMark platform={p} className="size-4.5" />
              {p.label}
            </TabsTab>
          ))}
        </TabsList>
        <Button variant="outline" size="sm" className="border-dashed" onClick={onAdd}>
          <Plus /> Add
        </Button>
      </div>
      {platforms.map((p) => (
        <TabsPanel key={p.id} value={p.id}>
          <PlatformPreview platform={p} {...props} />
        </TabsPanel>
      ))}
    </Tabs>
  );
}

function PlatformPreview({ platform, title, markdown, tags, author, options }: Props & { platform: Platform }) {
  const out = useMemo(
    () => renderForPlatform(platform, title, markdown, tags, options),
    [platform, title, markdown, tags, options],
  );
  const [copied, setCopied] = useState<"rich" | "md" | null>(null);
  const [dark, setDark] = useState(true);

  function done(kind: "rich" | "md") {
    track("markdown_copied", { platform: platform.group === "own" ? "own" : platform.id, kind });
    setCopied(kind);
    setTimeout(() => setCopied(null), 1500);
  }

  async function copyRich() {
    // Plain text is the markdown (dev.to's editor); rich editors like Medium
    // and X read the HTML flavor of the same clipboard item.
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/plain": new Blob([out.markdown], { type: "text/plain" }),
          "text/html": new Blob([out.html], { type: "text/html" }),
        }),
      ]);
    } catch {
      await navigator.clipboard.writeText(out.markdown);
    }
    done("rich");
  }

  async function copyMarkdown() {
    await navigator.clipboard.writeText(out.markdown);
    done("md");
  }

  const filename = `${(title || "untitled").replace(/[\\/:*?"<>|]+/g, "").trim() || "untitled"}.md`;
  const plain = platform.group === "words";

  return (
    <div className="space-y-3">
      <div
        className={`preview-page preview-${platform.group === "own" ? "own" : platform.id}`}
        data-theme={platform.dark && dark ? "dark" : "light"}
      >
        <article className="preview">
          <header>
            {platform.byline && (
              <div className="preview-byline">
                <span className="preview-avatar" aria-hidden="true">
                  {author.charAt(0).toUpperCase()}
                </span>
                <div>
                  <div className="preview-author">{author}</div>
                  {/* "today" can differ between server and browser time zones */}
                  <div className="preview-date" suppressHydrationWarning>
                    {platform.byline(new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }))}
                  </div>
                </div>
              </div>
            )}
            <h1 className="preview-title">{title || "Untitled"}</h1>
            {out.tags.length > 0 && (
              <div className="preview-tags">
                {out.tags.map((tag) => (
                  <span key={tag} className="preview-tag" style={{ "--tag-hue": tagHue(tag) } as CSSProperties}>
                    <span className="preview-tag-hash">#</span>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>
          <div className="preview-body" dangerouslySetInnerHTML={{ __html: out.html }} />
        </article>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={copyRich}>
          {copied === "rich" ? <Check /> : <Copy />}
          {copied === "rich" ? "Copied" : plain ? "Copy rich text" : `Copy for ${platform.label}`}
        </Button>
        {plain && (
          <Button variant="outline" onClick={copyMarkdown}>
            {copied === "md" ? <Check /> : null}
            {copied === "md" ? "Copied" : "Copy Markdown"}
          </Button>
        )}
        <Button variant="ghost" onClick={() => download(new Blob([out.markdown], { type: "text/markdown" }), filename)}>
          <Download /> Download .md
        </Button>
        {platform.dark && (
          <Button
            variant="outline"
            size="icon"
            className="ml-auto"
            aria-label={`Show ${platform.label} in ${dark ? "light" : "dark"} mode`}
            onClick={() => setDark(!dark)}
          >
            {dark ? <Sun /> : <Moon />}
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{platform.tip}</p>
    </div>
  );
}
