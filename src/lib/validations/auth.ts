import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const rejectionSchema = z.object({
  rejection_reason: z.string().trim().min(3, "Please provide a reason for rejection"),
});

export type RejectionFormValues = z.infer<typeof rejectionSchema>;
