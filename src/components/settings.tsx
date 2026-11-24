import { ArrowLeft, SlidersHorizontal, Tag, User } from "lucide-react";
import type { Draft } from "@/lib/drafts";
import type { Label } from "@/lib/look";
import { type SettingsTab, useNav } from "@/lib/nav";
import type { Site } from "@/lib/platforms";
import { cn } from "@/lib/utils";
import { AccountSettings } from "./settings-account";
import { LabelSettings } from "./settings-labels";
import { PreferenceSettings } from "./settings-preferences";

const TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: "account", label: "Account", icon: <User className="text-pink-700 dark:text-pink-300" /> },
  { id: "preferences", label: "Preferences", icon: <SlidersHorizontal className="text-violet-700 dark:text-violet-300" /> },
  { id: "labels", label: "Labels and sites", icon: <Tag className="text-teal-700 dark:text-teal-300" /> },
];

export function Settings({ tab, drafts, labels, sites }: { tab: SettingsTab; drafts: Draft[]; labels: Label[]; sites: Site[] }) {
  const { go } = useNav();
  return (
    <div className="flex min-h-screen flex-wrap items-stretch bg-ground">
      <aside className="flex w-full flex-col gap-4 p-3 lg:sticky lg:top-0 lg:h-screen lg:w-64">
        <button
          type="button"
          onClick={() => go({})}
          className="inline-flex h-8.5 items-center gap-2 self-start rounded-lg px-2.5 text-sm font-medium text-foreground/80 hover:bg-background"
        >
          <ArrowLeft className="size-4" /> Back to writing
        </button>
        <nav aria-labelledby="settings-heading" className="flex flex-col gap-0.5">
          <h2 id="settings-heading" className="px-2.5 pb-1.5 text-xs font-medium text-muted-foreground">
            Settings
          </h2>
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-current={tab === t.id ? "page" : undefined}
              onClick={() => go({ s: t.id })}
              className={cn(
                "flex h-8.5 items-center gap-2.5 rounded-lg px-2.5 text-sm text-foreground/80 hover:bg-background/70 [&_svg]:size-4",
                "aria-[current=page]:bg-background aria-[current=page]:font-medium aria-[current=page]:text-foreground aria-[current=page]:shadow-xs aria-[current=page]:ring-1 aria-[current=page]:ring-border",
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="m-2 min-w-0 flex-[999_1_560px] rounded-[18px] border bg-card shadow-xs">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 pt-11 pb-18 sm:px-8">
          {tab === "account" && <AccountSettings drafts={drafts} labels={labels} />}
          {tab === "preferences" && <PreferenceSettings sites={sites} />}
          {tab === "labels" && <LabelSettings drafts={drafts} labels={labels} sites={sites} />}
        </div>
      </main>
    </div>
  );
}

export function PageTitle({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 pb-2">
      <h1 className="text-[28px] font-semibold tracking-tight">{title}</h1>
      <p className="text-[15px] text-muted-foreground">{children}</p>
    </div>
  );
}
