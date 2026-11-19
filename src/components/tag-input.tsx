import { X } from "lucide-react";
import { useState } from "react";

/** Tag chips: Enter or a comma adds, Backspace on an empty field removes the last. */
export function TagInput({
  tags,
  onChange,
  max = 4, // dev.to's limit, the strictest of the platforms
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  max?: number;
}) {
  const [text, setText] = useState("");

  // Accepts several at once, so pasting "convex, ai, webdev" works.
  function add(raw: string) {
    const next = [...tags];
    for (const part of raw.split(",")) {
      const tag = part.trim().replace(/^#+/, "");
      const dupe = next.some((t) => t.toLowerCase() === tag.toLowerCase());
      if (tag && !dupe && next.length < max) next.push(tag);
    }
    if (next.length !== tags.length) onChange(next);
    setText("");
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-muted py-0.5 pr-1 pl-2 text-sm">
          #{tag}
          <button
            type="button"
            aria-label={`Remove tag ${tag}`}
            onClick={() => onChange(tags.filter((t) => t !== tag))}
            className="rounded text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </span>
      ))}
      {tags.length < max && (
        <input
          value={text}
          onChange={(e) => (e.target.value.includes(",") ? add(e.target.value) : setText(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(text);
            } else if (e.key === "Backspace" && !text && tags.length) {
              onChange(tags.slice(0, -1));
            }
          }}
          onBlur={() => text && add(text)}
          placeholder={tags.length ? "Add tag" : `Add up to ${max} tags…`}
          aria-label="Add tag"
          className="min-w-28 flex-1 bg-transparent py-0.5 text-sm outline-none placeholder:text-muted-foreground/60"
        />
      )}
    </div>
  );
}
