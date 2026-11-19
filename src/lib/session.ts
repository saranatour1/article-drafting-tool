import { createServerFn } from "@tanstack/react-start";
import { loadSession } from "./auth.server";

export const getSession = createServerFn({ method: "GET" }).handler(() => loadSession());
