import { Check, Globe, Mic, PenLine, Plus, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";
import { MIC_KEY, chosenMic } from "@/components/mic-button";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { HAND, VOICE } from "@/lib/look";
import { useNav } from "@/lib/nav";
import { PLAIN, type Site, destinationsFor } from "@/lib/platforms";
import { type Prefs, usePrefs } from "@/lib/prefs";
import { cn } from "@/lib/utils";
import { RULES, type Rule } from "@/lib/writing-check";
import { Card, PlatformMark, Row, Segmented } from "./bits";
import { DestinationsDialog } from "./destinations-dialog";
import { PageTitle } from "./settings";

// Dictation languages the browsers' speech services know; "" follows the browser.
const LANGUAGES = ["", "en-US", "en-GB", "en-AU", "en-IN", "ar", "de-DE", "es-ES", "es-MX", "fr-FR", "hi-IN", "it-IT", "ja-JP", "ko-KR", "nl-NL", "pl-PL", "pt-BR", "ru-RU", "sv-SE", "tr-TR", "uk-UA", "zh-CN"];
const languageName = (code: string) =>
  code ? (new Intl.DisplayNames(["en"], { type: "language" }).of(code) ?? code) : "Same as my browser";

const choice = "flex cursor-pointer flex-col gap-2.5 rounded-xl border p-3.5 has-[[data-checked]]:ring-3";

export function PreferenceSettings({ sites }: { sites: Site[] }) {
  const { prefs, savePrefs } = usePrefs();
  const { go } = useNav();
  const [picking, setPicking] = useState(false);
  const set = <K extends keyof Prefs>(key: K) => (value: Prefs[K]) => savePrefs({ [key]: value });
  const defaults = destinationsFor(prefs.destinations, sites).filter((p) => p.id !== PLAIN.id);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageTitle title="Preferences">How the page looks, how you start, and how dictation listens.</PageTitle>
        <span className="inline-flex items-center gap-1.5 pb-2 text-xs text-muted-foreground">
          <Check className="size-3.5 text-green-600" /> Changes save as you go
        </span>
      </div>

      <Card icon={<Sun />} tint="bg-pink-100 text-pink-800 dark:bg-pink-500/15 dark:text-pink-200" title="Look and feel" description="Follows your account to every browser you sign in on.">
        <Row title="Theme">
          <Segmented
            label="Theme"
            value={prefs.theme}
            onChange={set("theme")}
            options={[
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
              { value: "system", label: "Match system" },
            ]}
          />
        </Row>
        <Row title="Writing font" description="Just for the page you write on. Previews follow each site.">
          <RadioGroup aria-label="Writing font" value={prefs.writingFont} onValueChange={set("writingFont") as (v: string) => void} className="flex-row gap-2">
            {(["serif", "sans"] as const).map((font) => (
              <label key={font} className={cn(choice, "w-26 gap-1.5 px-3 py-2.5 has-[[data-checked]]:border-foreground has-[[data-checked]]:ring-border")}>
                <span className={cn("text-[26px] leading-none", font === "serif" ? "font-serif" : "font-medium")}>Aa</span>
                <span className="flex items-center gap-1.5 text-xs font-medium">
                  <RadioGroupItem value={font} /> {font === "serif" ? "Serif" : "Sans"}
                </span>
              </label>
            ))}
          </RadioGroup>
        </Row>
        <Row title="Text size">
          <Segmented
            label="Text size"
            value={prefs.textSize}
            onChange={set("textSize")}
            options={[
              { value: "sm", label: "Small" },
              { value: "md", label: "Medium" },
              { value: "lg", label: "Large" },
            ]}
          />
        </Row>
      </Card>

      <Card icon={<PenLine />} tint={HAND.soft} title="Where the app opens" description="What's waiting when you open the app. Home shows that way to start first, too.">
        <RadioGroup
          aria-label="Where the app opens"
          value={prefs.startWith}
          onValueChange={set("startWith") as (v: string) => void}
          className="flex-row flex-wrap gap-2.5 border-t px-5 py-4"
        >
          {(
            [
              ["speak", "Start talking", "Opens straight into dictation.", cn(VOICE.soft, "has-[[data-checked]]:ring-violet-300 dark:has-[[data-checked]]:ring-violet-500/40")],
              ["write", "Start writing", "Opens a blank page, cursor ready.", cn(HAND.soft, "has-[[data-checked]]:ring-orange-300 dark:has-[[data-checked]]:ring-orange-500/40")],
              ["ask", "Show Home", "Both ways to start, side by side.", "bg-card has-[[data-checked]]:border-foreground has-[[data-checked]]:ring-border"],
            ] as const
          ).map(([value, title, text, look]) => (
            <label key={value} className={cn(choice, "flex-[1_1_180px]", look)}>
              <span className="flex items-center justify-between">
                <span className="text-sm font-semibold">{title}</span>
                <RadioGroupItem value={value} />
              </span>
              <span className="text-xs opacity-80">{text}</span>
            </label>
          ))}
        </RadioGroup>
        <Row title="Idea box on Home" description="A one-line box to catch ideas before they slip away." htmlFor="idea-box">
          <Switch id="idea-box" checked={prefs.ideaBox} onCheckedChange={set("ideaBox")} />
        </Row>
      </Card>

      <Card icon={<Mic />} tint={VOICE.soft} title="Dictation" description="How the mic listens and turns speech into text.">
        <Row title="Language you speak" description="Starts as your browser's language." htmlFor="language">
          <NativeSelect id="language" value={prefs.language} onChange={(e) => savePrefs({ language: e.target.value })} className="w-64">
            {LANGUAGES.map((code) => (
              <NativeSelectOption key={code} value={code}>
                {languageName(code)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Row>
        <div className="flex flex-col gap-2 border-t px-5 py-4">
          <span id="listen-label" className="text-sm font-medium">
            How it listens
          </span>
          <RadioGroup aria-labelledby="listen-label" value={prefs.listen} onValueChange={set("listen") as (v: string) => void} className="gap-2">
            {(
              [
                ["auto", "Automatic", "Words appear live using your browser's speech recognition. If it can't reach a speech service, it switches to recording."],
                ["record", "Always record and transcribe", "Works in every browser. Text arrives a moment after each pause."],
              ] as const
            ).map(([value, title, text]) => (
              <label
                key={value}
                className="flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 has-[[data-checked]]:border-violet-600 has-[[data-checked]]:bg-violet-50/60 has-[[data-checked]]:ring-3 has-[[data-checked]]:ring-violet-200 dark:has-[[data-checked]]:bg-violet-500/10 dark:has-[[data-checked]]:ring-violet-500/25"
              >
                <RadioGroupItem value={value} className="mt-0.5" />
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">
                    {title} {value === "auto" && <span className="text-xs text-violet-700 dark:text-violet-300">Recommended</span>}
                  </span>
                  <span className="text-sm text-muted-foreground">{text}</span>
                </span>
              </label>
            ))}
          </RadioGroup>
        </div>
        <MicPicker />
        <Row
          title="Full screen for Speak"
          description="Speak opens the big listening view. Off, it opens a draft with the mic already on. The mic in the editor always stays inline."
          htmlFor="voice-fullscreen"
        >
          <Switch id="voice-fullscreen" checked={prefs.voiceFullscreen} onCheckedChange={set("voiceFullscreen")} />
        </Row>
      </Card>

      <Card
        icon={<Check />}
        tint="bg-yellow-100 text-yellow-900 dark:bg-yellow-500/15 dark:text-yellow-200"
        title="Writing check"
        description="Plain rules, no AI. Expect the odd false alarm."
        action={<Switch aria-label="Show the writing check above previews" checked={prefs.checks} onCheckedChange={set("checks")} />}
      >
        <fieldset disabled={!prefs.checks} className="grid grid-cols-1 gap-x-5 gap-y-2.5 border-t px-5 py-4 disabled:opacity-50 sm:grid-cols-2">
          <legend className="sr-only">Checks to run</legend>
          {(Object.keys(RULES) as Rule[]).map((rule) => (
            <label key={rule} className="flex cursor-pointer items-center gap-2.5 text-sm font-medium">
              <Checkbox
                checked={!prefs.checksOff.includes(rule)}
                onCheckedChange={(on) =>
                  savePrefs({ checksOff: on ? prefs.checksOff.filter((r) => r !== rule) : [...prefs.checksOff, rule] })
                }
              />
              {RULES[rule]}
            </label>
          ))}
        </fieldset>
      </Card>

      <Card
        icon={<Globe />}
        tint="bg-teal-100 text-teal-800 dark:bg-teal-500/15 dark:text-teal-200"
        title="Destinations for new drafts"
        description="Each new draft starts with these preview tabs. Change them per draft any time."
      >
        <div className="flex flex-wrap items-center gap-2 border-t px-5 py-4">
          <span className="inline-flex h-8.5 items-center gap-2 rounded-[10px] border bg-muted/40 pr-3 pl-1.5 text-[13px] font-medium">
            <PlatformMark platform={PLAIN} /> {PLAIN.label} <span className="font-normal text-muted-foreground">always</span>
          </span>
          {defaults.map((p) => (
            <span key={p.id} className="inline-flex h-8.5 items-center gap-2 rounded-[10px] border bg-background pr-1 pl-1.5 text-[13px] font-medium">
              <PlatformMark platform={p} /> {p.label}
              <button
                type="button"
                aria-label={`Remove ${p.label}`}
                onClick={() => savePrefs({ destinations: prefs.destinations.filter((id) => id !== p.id) })}
                className="grid size-6 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => setPicking(true)}
            className="inline-flex h-8.5 items-center gap-1.5 rounded-[10px] border border-dashed px-3 text-[13px] font-medium text-foreground/80 hover:bg-muted/40"
          >
            <Plus className="size-3.5" /> Add
          </button>
        </div>
        <Row
          title="Send to dev.to as an unpublished draft"
          description={
            <>
              Adds <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">published: false</code> to the front matter you copy.
            </>
          }
          htmlFor="devto-draft"
        >
          <Switch id="devto-draft" checked={prefs.devtoDraft} onCheckedChange={set("devtoDraft")} />
        </Row>
      </Card>

      <DestinationsDialog
        open={picking}
        onOpenChange={setPicking}
        title="Destinations for new drafts"
        value={prefs.destinations}
        sites={sites}
        onSave={(ids) => savePrefs({ destinations: ids })}
        onAddSite={() => go({ s: "labels" })}
      />
    </>
  );
}

/** Device ids belong to this browser, so the choice lives in localStorage, not the account. */
function MicPicker() {
  const [mics, setMics] = useState<MediaDeviceInfo[]>([]);
  const [mic, setMic] = useState("");

  async function load() {
    setMics((await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === "audioinput"));
  }
  useEffect(() => {
    setMic(chosenMic());
    if (!navigator.mediaDevices?.enumerateDevices) return;
    void load();
    navigator.mediaDevices.addEventListener("devicechange", load);
    return () => navigator.mediaDevices.removeEventListener("devicechange", load);
  }, []);

  // Browsers hide device names until the page has had mic access once.
  async function showNames() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      for (const track of stream.getTracks()) track.stop();
      await load();
    } catch {
      window.alert("Microphone access is blocked. Allow it in your browser's site settings to see the names.");
    }
  }

  function pick(id: string) {
    setMic(id);
    try {
      if (id) localStorage.setItem(MIC_KEY, id);
      else localStorage.removeItem(MIC_KEY);
    } catch {} // private mode: the default mic it is
  }

  const unnamed = mics.length > 0 && mics.every((m) => !m.label);
  return (
    <Row
      title="Microphone"
      description="Saved for this browser. Picking one records and transcribes, since live recognition always listens on the system default."
      htmlFor="mic"
    >
      <div className="flex items-center gap-2">
        {unnamed && (
          <Button variant="ghost" onClick={showNames}>
            Show names
          </Button>
        )}
        <NativeSelect id="mic" value={mic} onChange={(e) => pick(e.target.value)} className="w-64">
          <NativeSelectOption value="">System default</NativeSelectOption>
          {mics
            .filter((m) => m.deviceId && m.deviceId !== "default")
            .map((m, i) => (
              <NativeSelectOption key={m.deviceId} value={m.deviceId}>
                {m.label || `Microphone ${i + 1}`}
              </NativeSelectOption>
            ))}
        </NativeSelect>
      </div>
    </Row>
  );
}
