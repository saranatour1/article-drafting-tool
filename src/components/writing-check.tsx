import { CircleAlert, CircleCheck, PenLine } from "lucide-react";
import { useMemo } from "react";
import { type Rule, checkWriting } from "@/lib/writing-check";

/** The rule-based check above the previews. Closed, it's a one-line verdict. Rules in `off` are skipped. */
export function WritingCheck({ title, markdown, off }: { title: string; markdown: string; off: string[] }) {
  const result = useMemo(() => checkWriting(title, markdown), [title, markdown]);
  const on = (rule: Rule) => !off.includes(rule);
  const article = on("search") ? result.article : [];
  const paragraphs = result.paragraphs.map((p) => ({ ...p, issues: p.issues.filter((i) => on(i.rule)) }));
  const needWork = paragraphs.filter((p) => p.issues.length > 0);
  const notes = article.filter((a) => !a.ok).length;
  const verdict =
    paragraphs.length === 0
      ? "nothing to check yet"
      : needWork.length === 0
        ? `all ${paragraphs.length} paragraphs look fine`
        : `${needWork.length} of ${paragraphs.length} paragraphs need work`;

  return (
    <details className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-950 dark:border-yellow-500/20 dark:bg-yellow-500/10 dark:text-yellow-100">
      <summary className="flex cursor-pointer items-center gap-2 font-medium">
        <PenLine className="size-4 shrink-0" />
        <span>
          Writing check: {verdict}
          {notes > 0 && <span className="font-normal opacity-80"> · {notes} article note{notes === 1 ? "" : "s"}</span>}
        </span>
      </summary>
      {article.length > 0 && (
        <ul className="mt-3 space-y-1">
          {article.map((a) => (
            <li key={a.text} className="flex items-start gap-2">
              {a.ok ? (
                <CircleCheck aria-label="Fine" className="mt-0.5 size-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
              ) : (
                <CircleAlert aria-label="Needs work" className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-400" />
              )}
              {a.text}
            </li>
          ))}
        </ul>
      )}
      {needWork.length > 0 && (
        <ul className="mt-3 space-y-2 border-t border-yellow-200 pt-3 dark:border-yellow-500/20">
          {needWork.map((p, i) => (
            <li key={i}>
              <div className="font-medium">“{p.start}”</div>
              <div className="opacity-80">{p.issues.map((issue) => issue.text).join(" · ")}</div>
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}
