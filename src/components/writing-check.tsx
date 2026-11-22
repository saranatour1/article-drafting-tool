import { CircleAlert, CircleCheck } from "lucide-react";
import { useMemo } from "react";
import { checkWriting } from "@/lib/writing-check";

/** The rule-based check above the previews. Closed, it's a one-line verdict. */
export function WritingCheck({ title, markdown }: { title: string; markdown: string }) {
  const { article, paragraphs } = useMemo(() => checkWriting(title, markdown), [title, markdown]);
  const needWork = paragraphs.filter((p) => p.issues.length > 0);
  const notes = article.filter((a) => !a.ok).length;
  const verdict =
    paragraphs.length === 0
      ? "nothing to check yet"
      : needWork.length === 0
        ? `all ${paragraphs.length} paragraphs look fine`
        : `${needWork.length} of ${paragraphs.length} paragraphs need work`;

  return (
    <details className="mb-4 rounded-lg border bg-background px-4 py-3 text-sm">
      <summary className="cursor-pointer font-medium">
        Writing check: {verdict}
        {notes > 0 && <span className="text-muted-foreground"> · {notes} article note{notes === 1 ? "" : "s"}</span>}
      </summary>
      <ul className="mt-3 space-y-1">
        {article.map((a) => (
          <li key={a.text} className="flex items-start gap-2">
            {a.ok ? (
              <CircleCheck aria-label="Fine" className="mt-0.5 size-4 shrink-0 text-emerald-600" />
            ) : (
              <CircleAlert aria-label="Needs work" className="mt-0.5 size-4 shrink-0 text-amber-600" />
            )}
            {a.text}
          </li>
        ))}
      </ul>
      {needWork.length > 0 && (
        <ul className="mt-3 space-y-2 border-t pt-3">
          {needWork.map((p, i) => (
            <li key={i}>
              <div className="font-medium">“{p.start}”</div>
              <div className="text-muted-foreground">{p.issues.join(" · ")}</div>
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}
