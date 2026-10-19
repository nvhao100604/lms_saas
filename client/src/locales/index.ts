import { viTranslations } from "./vi";
import { enTranslations } from "./en";
import type { SupportedLanguage, Translations } from "./types";

export * from "./types";
export { viTranslations } from "./vi";
export { enTranslations } from "./en";

export const translations: Record<SupportedLanguage, Translations> = {
  vi: viTranslations,
  en: enTranslations,
};

export const DEFAULT_LANGUAGE: SupportedLanguage = "vi";
