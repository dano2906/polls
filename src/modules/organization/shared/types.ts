import type { z } from "zod";
import type { createOrganizationSchema } from "../lib/validation";

export type CreateOrganization = z.infer<typeof createOrganizationSchema>;
