import { ConvexReactClient } from "convex/react";

export const convexUrl: string = import.meta.env.VITE_CONVEX_URL;

// ConvexReactClient connects lazily, so creating it during SSR opens nothing.
export const convex = new ConvexReactClient(convexUrl);
