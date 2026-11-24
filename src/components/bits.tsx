import { authorName, type Me } from "@/lib/prefs";
import { LABEL_COLORS, type Label } from "@/lib/look";
import type { Platform } from "@/lib/platforms";
import { initials } from "@/lib/text";
import { cn } from "@/lib/utils";

// Small pieces shared by several screens.

export function Avatar({ me, className }: { me: Me; className?: string }) {
  if (me.avatarUrl) return <img src={me.avatarUrl} alt="" className={cn("size-8 shrink-0 rounded-full object-cover", className)} />;
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-full bg-pink-100 text-xs font-semibold text-pink-800 dark:bg-pink-500/20 dark:text-pink-200",
        className,
      )}
    >
      {initials(authorName(me))}
    </span>
  );
}

/** A destination's tile: letters, not the site's logo. */
export function PlatformMark({ platform, className }: { platform: Platform; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-5.5 shrink-0 place-items-center rounded-md bg-muted font-bold text-foreground/80",
        platform.mark.length > 2 ? "text-[0.5rem]" : "text-[0.6875rem]",
        className,
      )}
    >
      {platform.mark}
    </span>
  );
}

export const LabelDot = ({ label, className }: { label: Label; className?: string }) => (
  <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-[3px]", LABEL_COLORS[label.color].dot, className)} />
);

export function LabelChip({ label, children }: { label: Label; children?: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-md px-2 text-xs font-medium",
        LABEL_COLORS[label.color].chip,
      )}
    >
      <LabelDot label={label} />
      {label.name}
      {children}
    </span>
  );
}

/** Settings and dialogs: a bordered card with an icon tile, a title and a line under it. */
export function Card({
  icon,
  tint,
  title,
  description,
  action,
  id,
  className,
  children,
}: {
  icon: React.ReactNode;
  tint: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  id?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const headingId = `${title.toLowerCase().replace(/\W+/g, "-")}-title`;
  return (
    <section id={id} aria-labelledby={headingId} className={cn("rounded-2xl border bg-card shadow-xs", className)}>
      <div className="flex items-start gap-3 p-5">
        <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg [&_svg]:size-4", tint)}>{icon}</span>
        <div className="flex-1">
          <h2 id={headingId} className="text-[15px] font-semibold">
            {title}
          </h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** One setting: what it is on the left, its control on the right. */
export function Row({
  title,
  description,
  htmlFor,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  htmlFor?: string;
  children?: React.ReactNode;
}) {
  const Label = htmlFor ? "label" : "div";
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t px-5 py-4">
      <Label htmlFor={htmlFor} className="flex min-w-60 flex-1 flex-col gap-0.5">
        <span className="text-sm font-medium">{title}</span>
        {description && <span className="text-sm text-muted-foreground">{description}</span>}
      </Label>
      {children}
    </div>
  );
}

/** Two to four buttons that act as one choice. */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: React.ReactNode; title?: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex gap-0.5 rounded-[10px] bg-muted p-[3px]">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          aria-label={o.title}
          onClick={() => onChange(o.value)}
          className="flex h-7.5 items-center justify-center gap-1.5 rounded-lg px-3 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:shadow-xs [&_svg]:size-3.5"
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
