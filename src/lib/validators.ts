import { z } from "zod";

export const quoteSchema = z.object({
  newspaperId: z.string().min(1),
  formatId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  wordCount: z.number().int().min(1).max(2000).optional(),
  areaCm2: z.number().int().min(1).max(5000).optional(),
  colour: z.boolean().optional(),
  couponCode: z.string().max(40).optional(),
});

export const bookingSchema = z
  .object({
    idempotencyKey: z.string().min(16).max(64),
    locationId: z.string().min(1),
    newspaperId: z.string().min(1),
    categoryId: z.string().min(1),
    formatId: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    artworkUploadId: z.string().min(10).max(40).optional(),
    content: z.object({
      headline: z.string().max(120).optional(),
      body: z.string().max(5000),
      contact: z.string().min(3).max(300),
      website: z.string().url().optional().or(z.literal("")),
      notes: z.string().max(1000).optional(),
    }),
    quote: quoteSchema.omit({ newspaperId: true, formatId: true, date: true }),
    customer: z.object({
      name: z.string().min(2).max(100),
      email: z.string().email(),
      phone: z.string().regex(/^\+\d{8,15}$/, "Use country code, e.g. +919876543210"),
      gstin: z.string().max(15).optional(),
    }),
    acceptTerms: z.literal(true),
  })
  .superRefine((value, ctx) => {
    if (!value.artworkUploadId && !value.content.body.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["content", "body"],
        message: "Advertisement text is required",
      });
    }
  });