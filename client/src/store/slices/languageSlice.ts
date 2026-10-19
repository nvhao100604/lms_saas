import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  translations,
  DEFAULT_LANGUAGE,
  type SupportedLanguage,
  type Translations,
} from "@/locales";

export type { SupportedLanguage, Translations };

export interface LanguageState {
  currentLanguage: SupportedLanguage;
  t: Translations;
}

const initialState: LanguageState = {
  currentLanguage: DEFAULT_LANGUAGE,
  t: translations[DEFAULT_LANGUAGE],
};

export const languageSlice = createSlice({
  name: "language",
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<SupportedLanguage>) => {
      state.currentLanguage = action.payload;
      state.t = translations[action.payload];
    },
    toggleLanguage: (state) => {
      const nextLang: SupportedLanguage =
        state.currentLanguage === "vi" ? "en" : "vi";
      state.currentLanguage = nextLang;
      state.t = translations[nextLang];
    },
  },
});

export const { setLanguage, toggleLanguage } = languageSlice.actions;
export default languageSlice.reducer;
