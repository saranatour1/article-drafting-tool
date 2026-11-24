import { useMutation } from "convex/react";
import { Download, FileText, KeyRound, Lock, LogOut, User } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { GithubIcon } from "@/components/auth-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label as FieldLabel } from "@/components/ui/label";
import { type Draft, getDraftStore } from "@/lib/drafts";
import type { Label } from "@/lib/look";
import { usePrefs } from "@/lib/prefs";
import { api } from "../../convex/_generated/api";
import { exportEverything, useSignOut } from "./account-menu";
import { Avatar, Card, Row } from "./bits";
import { PageTitle } from "./settings";

export function AccountSettings({ drafts, labels }: { drafts: Draft[]; labels: Label[] }) {
  const { me } = usePrefs();
  const setDisplayName = useMutation(api.users.setDisplayName);
  const setAvatar = useMutation(api.users.setAvatar);
  const uploadUrl = useMutation(api.images.generateUploadUrl);
  const file = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [changing, setChanging] = useState(false);
  const signOut = useSignOut();

  async function upload(photo: File) {
    setUploading(true);
    try {
      const res = await fetch(await uploadUrl({}), { method: "POST", headers: { "Content-Type": photo.type }, body: photo });
      if (!res.ok) throw new Error(`upload failed (${res.status})`);
      const { storageId } = await res.json();
      const problem = await setAvatar({ storageId });
      if (problem) window.alert(problem);
    } catch (e) {
      window.alert(`Couldn't use that photo: ${e instanceof Error ? e.message : e}`);
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <PageTitle title="Account">Who you are here, how you sign in, and your writing to take with you.</PageTitle>

      <Card icon={<User />} tint="bg-pink-100 text-pink-800 dark:bg-pink-500/15 dark:text-pink-200" title="Profile" description="Shown as the author on your previews.">
        <div className="flex flex-wrap items-center gap-4 border-t px-5 py-4">
          <Avatar me={me} className="size-14 text-lg" />
          <input
            ref={file}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const photo = e.target.files?.[0];
              e.target.value = "";
              if (photo) void upload(photo);
            }}
          />
          <Button variant="outline" disabled={uploading} onClick={() => file.current?.click()}>
            {uploading ? "Uploading…" : "Upload a photo"}
          </Button>
          {me.avatarUrl && (
            <Button variant="ghost" onClick={() => void setAvatar({ storageId: null })}>
              Use initials
            </Button>
          )}
        </div>
        <Row title="Display name" description="Leave it empty to show your username." htmlFor="display-name">
          <Input
            id="display-name"
            defaultValue={me.displayName ?? ""}
            placeholder={me.username ?? "Your name"}
            maxLength={80}
            onBlur={(e) => {
              if (e.target.value.trim() !== (me.displayName ?? "")) void setDisplayName({ displayName: e.target.value });
            }}
            className="h-9 max-w-72 flex-1"
          />
        </Row>
        {me.username && (
          <Row title="Username" description={me.hasPassword ? "You sign in with this." : "Your GitHub login."}>
            <span className="flex h-9 max-w-72 flex-1 items-center rounded-lg border bg-muted/40 px-3 text-sm text-foreground/80">
              @{me.username}
            </span>
          </Row>
        )}
      </Card>

      <Card icon={<Lock />} tint="bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-200" title="Signing in" description="The ways you can get into your drafts.">
        {me.hasPassword && (
          <Row
            title={
              <span className="inline-flex items-center gap-2">
                <KeyRound className="size-4 text-muted-foreground" /> Username and password
              </span>
            }
            description="Works on any browser."
          >
            <Button variant="outline" onClick={() => setChanging(true)}>
              Change password
            </Button>
          </Row>
        )}
        {me.githubLogin && (
          <Row
            title={
              <span className="inline-flex items-center gap-2">
                <GithubIcon /> GitHub
              </span>
            }
            description={`Signed in as @${me.githubLogin}.`}
          />
        )}
      </Card>

      <Card
        id="export"
        icon={<FileText />}
        tint="bg-teal-100 text-teal-800 dark:bg-teal-500/15 dark:text-teal-200"
        title="Your writing"
        description="It's yours. Take it anywhere."
      >
        <Row
          title="Export everything"
          description="Every draft and idea as a Markdown file, in one .zip. Labels and publish tags go in each file's front matter."
        >
          <Button variant="outline" onClick={() => exportEverything(drafts, labels)}>
            <Download /> Download .zip
          </Button>
        </Row>
        <Row title="Sync" description="Changes you make offline wait on this device and sync when you're back online.">
          <SyncStatus />
        </Row>
      </Card>

      <Card icon={<LogOut />} tint="bg-muted text-foreground/80" title="Leaving" description="Your drafts stay in your account.">
        <Row title="Sign out of this browser">
          <Button variant="outline" onClick={signOut}>
            Sign out
          </Button>
        </Row>
      </Card>

      <ChangePassword open={changing} onOpenChange={setChanging} />
    </>
  );
}

function SyncStatus() {
  const [state, setState] = useState({ pending: 0, online: true });
  useEffect(() => {
    const read = () => setState({ pending: getDraftStore().pendingCount(), online: navigator.onLine });
    read();
    const tick = setInterval(read, 1500);
    return () => clearInterval(tick);
  }, []);
  const ok = state.online && state.pending === 0;
  return (
    <span
      role="status"
      className={
        ok
          ? "inline-flex h-6.5 items-center gap-1.5 rounded-full bg-green-100 px-2.5 text-xs font-semibold text-green-800 dark:bg-green-500/15 dark:text-green-200"
          : "inline-flex h-6.5 items-center gap-1.5 rounded-full bg-yellow-100 px-2.5 text-xs font-semibold text-yellow-900 dark:bg-yellow-500/15 dark:text-yellow-200"
      }
    >
      <span className={ok ? "size-1.5 rounded-full bg-green-600" : "size-1.5 rounded-full bg-yellow-500"} />
      {ok
        ? "All synced"
        : `${state.online ? "" : "Offline. "}${state.pending} change${state.pending === 1 ? "" : "s"} waiting`}
    </span>
  );
}

const PASSWORD_ERRORS: Record<string, string> = {
  INVALID_CREDENTIALS: "Your current password isn't right.",
  RATE_LIMITED: "Too many tries. Wait a minute and try again.",
  PASSWORD_TOO_SHORT: "The new password is too short.",
  PASSWORD_TOO_LONG: "The new password is too long.",
  PASSWORD_HAS_SURROUNDING_WHITESPACE: "The new password can't start or end with a space.",
  PASSWORD_TOO_COMMON: "That password is too common. Pick another.",
  NOT_LOGGED_IN: "You're signed out. Sign in again first.",
};

function ChangePassword({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const change = useMutation(api.auth.changePassword);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setError(null);
    setPending(true);
    try {
      const result = await change({
        currentPassword: String(form.get("current")),
        newPassword: String(form.get("new")),
        signOutOtherSessions: true, // someone who had the old password is signed out elsewhere
      });
      if (result.success) onOpenChange(false);
      else setError(PASSWORD_ERRORS[result.userError.error] ?? "Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (setError(null), onOpenChange(o))}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
            <DialogDescription>Other browsers you're signed in on will be signed out.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <FieldLabel htmlFor="current-password">Current password</FieldLabel>
            <Input id="current-password" name="current" type="password" autoComplete="current-password" required disabled={pending} />
          </div>
          <div className="flex flex-col gap-2">
            <FieldLabel htmlFor="new-password">New password</FieldLabel>
            <Input id="new-password" name="new" type="password" autoComplete="new-password" required disabled={pending} />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              Change password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
