import { Check, Copy, Moon, Sun } from "lucide-react";
import { type CSSProperties, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PLATFORMS, type Platform, renderForPlatform } from "@/lib/platforms";

type Props = { title: string; markdown: string; tags: string[]; author: string };

// dev.to colors each tag from its own database; a stable hue per name stands in.
const tagHue = (tag: string) => [...tag].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);

export function Preview(props: Props) {
  return (
    <Tabs defaultValue={PLATFORMS[0].id} className="gap-4">
      <TabsList>
        {PLATFORMS.map((p) => (
          <TabsTrigger key={p.id} value={p.id}>
            {p.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {PLATFORMS.map((p) => (
        <TabsContent key={p.id} value={p.id}>
          <PlatformPreview platform={p} {...props} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

function PlatformPreview({ platform, title, markdown, tags, author }: Props & { platform: Platform }) {
  const out = useMemo(
    () => renderForPlatform(platform, title, markdown, tags),
    [platform, title, markdown, tags],
  );
  const [copied, setCopied] = useState(false);
  const [dark, setDark] = useState(true);

  async function copy() {
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
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-muted-foreground">{platform.tip}</p>
        <div className="flex shrink-0 gap-2">
          {platform.dark && (
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={`Show ${platform.label} in ${dark ? "light" : "dark"} mode`}
              onClick={() => setDark(!dark)}
            >
              {dark ? <Sun /> : <Moon />}
            </Button>
          )}
          <Button size="sm" onClick={copy}>
            {copied ? <Check /> : <Copy />}
            {copied ? "Copied" : "Copy markdown"}
          </Button>
        </div>
      </div>
      <div
        className={`preview-page preview-${platform.id}`}
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
                    {platform.byline(
                      new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                    )}
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
    </div>
  );
}
