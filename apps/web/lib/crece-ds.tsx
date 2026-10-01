"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type AnyProps = { children?: React.ReactNode; [key: string]: unknown };
export type CreceComponents = Record<string, React.ComponentType<AnyProps>>;

const CreceContext = createContext<CreceComponents | null>(null);

export function CreceProvider({ children }: { children: React.ReactNode }) {
  const [crece, setCrece] = useState<CreceComponents | null>(null);

  useEffect(() => {
    const win = window as Window & { React?: typeof React; Crece?: CreceComponents };
    win.React = React;
    if (win.Crece?.Button) {
      setCrece(win.Crece);
      return;
    }
    const script = document.createElement("script");
    script.src = "/ds/bundle.js";
    script.async = true;
    script.onload = () => setCrece(win.Crece ?? null);
    document.body.appendChild(script);
  }, []);

  return <CreceContext.Provider value={crece}>{children}</CreceContext.Provider>;
}

export function useCrece(): CreceComponents | null {
  return useContext(CreceContext);
}
