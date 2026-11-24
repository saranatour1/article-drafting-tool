import { useAuthActions } from "@convex-dev/auth/react";
import { reset, track } from "@databuddy/sdk";
import { ChevronUp, Download, LogOut, Monitor, Moon, SlidersHorizontal, Sun, Tag, User } from "lucide-react";
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu";
import type { Draft } from "@/lib/drafts";
import { download, exportZip } from "@/lib/export";
import type { Label } from "@/lib/look";
import { useNav } from "@/lib/nav";
import { type Prefs, authorName, usePrefs } from "@/lib/prefs";
import { Avatar } from "./bits";

export function exportEverything(drafts: Draft[], labels: Label[]) {
  const names = new Map(labels.map((l) => [l.clientId, l.name]));
  download(exportZip(drafts, (id) => names.get(id)), "article-drafts.zip");
  track("export_downloaded", { drafts: drafts.length });
}

export function useSignOut() {
  const { signOut } = useAuthActions();
  return () => {
    reset(); // the next person on this browser starts as a new visitor
    void signOut();
  };
}

/** The sidebar's footer: who's signed in, and everything about the account. */
export function AccountMenu({ drafts, labels }: { drafts: Draft[]; labels: Label[] }) {
  const { me, prefs, savePrefs } = usePrefs();
  const { go } = useNav();
  const signOut = useSignOut();
  return (
    <Menu>
      <MenuTrigger className="flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left text-sm outline-none hover:bg-background focus-visible:ring-2 focus-visible:ring-ring data-popup-open:bg-background data-popup-open:shadow-xs">
        <Avatar me={me} />
        <span className="min-w-0 flex-1 truncate">{me.username ?? authorName(me)}</span>
        <ChevronUp className="size-3.5 text-muted-foreground" />
      </MenuTrigger>
      <MenuPopup side="top" align="start" className="w-72">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar me={me} className="size-10 text-sm" />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{authorName(me)}</div>
            {me.username && <div className="truncate text-xs text-muted-foreground">@{me.username}</div>}
          </div>
        </div>
        <MenuSeparator />
        <MenuGroup>
          <MenuGroupLabel>Theme</MenuGroupLabel>
          <MenuRadioGroup value={prefs.theme} onValueChange={(theme) => savePrefs({ theme: theme as Prefs["theme"] })}>
            <MenuRadioItem value="light">
              <span className="flex items-center gap-2">
                <Sun /> Light
              </span>
            </MenuRadioItem>
            <MenuRadioItem value="dark">
              <span className="flex items-center gap-2">
                <Moon /> Dark
              </span>
            </MenuRadioItem>
            <MenuRadioItem value="system">
              <span className="flex items-center gap-2">
                <Monitor /> Match system
              </span>
            </MenuRadioItem>
          </MenuRadioGroup>
        </MenuGroup>
        <MenuSeparator />
        <MenuItem onClick={() => go({ s: "account" })}>
          <User className="text-pink-700 dark:text-pink-300" /> Account
        </MenuItem>
        <MenuItem onClick={() => go({ s: "preferences" })}>
          <SlidersHorizontal className="text-violet-700 dark:text-violet-300" /> Preferences
        </MenuItem>
        <MenuItem onClick={() => go({ s: "labels" })}>
          <Tag className="text-teal-700 dark:text-teal-300" /> Labels and sites
        </MenuItem>
        <MenuItem onClick={() => exportEverything(drafts, labels)}>
          <Download className="text-blue-700 dark:text-blue-300" /> Export everything
        </MenuItem>
        <MenuSeparator />
        <MenuItem onClick={signOut}>
          <LogOut /> Sign out
        </MenuItem>
      </MenuPopup>
    </Menu>
  );
}
