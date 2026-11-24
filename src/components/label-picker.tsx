import { useMutation } from "convex/react";
import { Check, Plus, Settings2 } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { LABEL_COLORS, type Label, type LabelColor } from "@/lib/look";
import { api } from "../../convex/_generated/api";
import { LabelDot } from "./bits";

const COLORS = Object.keys(LABEL_COLORS) as LabelColor[];

/** Toggle a draft's labels, or make a new one on the spot. */
export function LabelPicker({
  labels,
  value,
  onChange,
  onManage,
}: {
  labels: Label[];
  value: string[];
  onChange: (ids: string[]) => void;
  onManage: () => void;
}) {
  const save = useMutation(api.labels.save);
  const [name, setName] = useState("");

  function create(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const clientId = crypto.randomUUID();
    void save({ clientId, name: trimmed.slice(0, 40), color: COLORS[labels.length % COLORS.length] });
    onChange([...value, clientId]);
    setName("");
  }

  return (
    <Popover>
      <PopoverTrigger className="inline-flex h-6.5 items-center gap-1 rounded-md border border-dashed px-2 text-xs font-medium text-foreground/80 hover:bg-background">
        <Plus className="size-3" /> Label
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 gap-1 p-1.5">
        {labels.map((l) => {
          const on = value.includes(l.clientId);
          return (
            <button
              key={l.clientId}
              type="button"
              role="menuitemcheckbox"
              aria-checked={on}
              onClick={() => onChange(on ? value.filter((id) => id !== l.clientId) : [...value, l.clientId])}
              className="flex h-8 items-center gap-2 rounded-md px-2 text-left text-sm hover:bg-muted"
            >
              <LabelDot label={l} className="size-2.5" />
              <span className="flex-1 truncate">{l.name}</span>
              {on && <Check className="size-3.5" />}
            </button>
          );
        })}
        <form onSubmit={create} className="flex gap-1 border-t pt-1.5">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New label"
            aria-label="New label name"
            maxLength={40}
            className="h-8 min-w-0 flex-1 rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <button type="submit" className="h-8 rounded-md bg-primary px-2.5 text-xs font-medium text-primary-foreground">
            Add
          </button>
        </form>
        <button
          type="button"
          onClick={onManage}
          className="flex h-8 items-center gap-2 rounded-md px-2 text-left text-xs text-muted-foreground hover:bg-muted"
        >
          <Settings2 className="size-3.5" /> Rename, recolor or delete labels
        </button>
      </PopoverContent>
    </Popover>
  );
}
