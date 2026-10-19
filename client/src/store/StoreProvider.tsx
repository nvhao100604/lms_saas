"use client";

import { useState, useEffect } from "react";
import { Provider } from "react-redux";
import { makeStore } from "./index";
import { useAppSelector } from "./hooks";

function LanguageHtmlSync() {
  const currentLanguage = useAppSelector(
    (state) => state.language.currentLanguage
  );

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = currentLanguage;
    }
  }, [currentLanguage]);

  return null;
}

export default function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [store] = useState(() => makeStore());

  return (
    <Provider store={store}>
      <LanguageHtmlSync />
      {children}
    </Provider>
  );
}
