import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { z } from "zod";

const storageKey = "poll-theme";

export const getThemeServerFn = createServerFn().handler(
	() => (getCookie(storageKey) ?? "dark") as z.infer<typeof setThemeValidator>,
);

const setThemeValidator = z.enum(["light", "dark"]);

export const setThemeServerFn = createServerFn()
	.inputValidator(setThemeValidator)
	.handler(({ data }) => setCookie(storageKey, data));
