// Class names for the app's few colors. Kept here, as whole strings, so Tailwind finds them.

/** Talking: violet. */
export const VOICE = {
  soft: "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-500/25 dark:bg-violet-500/10 dark:text-violet-200",
  solid: "bg-violet-600 text-white hover:bg-violet-700",
};

/** Typing: orange. */
export const HAND = {
  soft: "border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-500/25 dark:bg-orange-500/10 dark:text-orange-200",
  solid: "bg-orange-700 text-white hover:bg-orange-800",
};

export const LABEL_COLORS = {
  violet: { dot: "bg-violet-600", chip: "bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-200" },
  blue: { dot: "bg-blue-700", chip: "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-200" },
  teal: { dot: "bg-teal-700", chip: "bg-teal-100 text-teal-800 dark:bg-teal-500/15 dark:text-teal-200" },
  green: { dot: "bg-green-700", chip: "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-200" },
  yellow: { dot: "bg-yellow-600", chip: "bg-yellow-100 text-yellow-900 dark:bg-yellow-500/15 dark:text-yellow-200" },
  orange: { dot: "bg-orange-700", chip: "bg-orange-100 text-orange-900 dark:bg-orange-500/15 dark:text-orange-200" },
  pink: { dot: "bg-pink-600", chip: "bg-pink-100 text-pink-800 dark:bg-pink-500/15 dark:text-pink-200" },
  gray: { dot: "bg-zinc-500", chip: "bg-zinc-100 text-zinc-800 dark:bg-zinc-500/20 dark:text-zinc-200" },
} as const;

export type LabelColor = keyof typeof LABEL_COLORS;
export type Label = { clientId: string; name: string; color: LabelColor };

/** Idea notes cycle through these so a row of them reads as a wall of stickies. */
export const IDEA_TINTS = [
  "border-yellow-200 bg-yellow-50 text-yellow-950 dark:border-yellow-500/20 dark:bg-yellow-500/10 dark:text-yellow-100",
  "border-pink-200 bg-pink-50 text-pink-950 dark:border-pink-500/20 dark:bg-pink-500/10 dark:text-pink-100",
  "border-blue-200 bg-blue-50 text-blue-950 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-100",
  "border-green-200 bg-green-50 text-green-950 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-100",
];
