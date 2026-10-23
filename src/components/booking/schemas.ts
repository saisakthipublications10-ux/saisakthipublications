import { z } from "zod";

export const contentSchema = z.object({
  headline: z.string().max(120, "Keep the headline under 120 characters").optional(),
  body: z.string().trim().min(1, "Enter your advertisement text").max(5000),
  contact: z.string().trim().min(3, "Enter the contact details to publish").max(300),
  website: z.string().trim().url("Enter a full URL, e.g. https://example.com").optional().or(z.literal("")),
  notes: z.string().max(1000).optional(),
});

export const uploadContentSchema = contentSchema.extend({ body: z.string().optional() });

export const customerSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(100),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z.string().regex(/^\+\d{8,15}$/, "Include the country code, e.g. +919876543210"),
  gstin: z.string().trim().regex(/^[0-9A-Z]{15}$/, "GSTIN must be 15 characters").optional().or(z.literal("")),
});

export function issuesToMap(issues: z.ZodIssue[]) {
  const out: Record<string, string> = {};
  for (const i of issues) out[String(i.path[0])] ??= i.message;
  return out;
}