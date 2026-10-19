import { z } from "zod";
import { translations, DEFAULT_LANGUAGE, type Translations } from "@/locales";

export const createLoginSchema = (t: Translations = translations[DEFAULT_LANGUAGE]) =>
  z.object({
    email: z
      .string()
      .min(1, t.auth.validation.emailRequired)
      .email(t.auth.validation.emailInvalid),
    password: z
      .string()
      .min(6, t.auth.validation.passwordMin)
      .max(100, t.auth.validation.passwordMax),
  });

export const createRegisterSchema = (t: Translations = translations[DEFAULT_LANGUAGE]) =>
  createLoginSchema(t)
    .extend({
      fullName: z
        .string()
        .min(2, t.auth.validation.fullNameMin)
        .max(50, t.auth.validation.fullNameMax),
      confirmPassword: z.string().min(1, t.auth.validation.confirmPasswordRequired),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t.auth.validation.passwordsDoNotMatch,
      path: ["confirmPassword"],
    });

export const loginSchema = createLoginSchema();
export const registerSchema = createRegisterSchema();

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
