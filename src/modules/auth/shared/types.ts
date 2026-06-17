import type z from "zod";
import type { ROLE_OPTIONS } from "../lib/constants";
import type { createUserSchema, editUserSchema } from "../lib/validation";

export type CreateUser = z.infer<typeof createUserSchema>;

export type EditUser = z.infer<typeof editUserSchema>;

export type UserRole = (typeof ROLE_OPTIONS)[number]["value"];
