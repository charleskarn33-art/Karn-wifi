import { z } from "zod";

export const createUserSchema = z.object({
  full_name: z.string().trim().min(2, "Full name is required"),
  email: z.string().trim().email("Enter a valid email address"),
  role: z.enum(["admin", "manager", "staff"]),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;
