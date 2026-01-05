import { createContext, useContext, useState, type ReactNode } from "react";

interface LayoutContextValue {
  rightSidebarContent: ReactNode | null;
  setRightSidebarContent: (content: ReactNode | null) => void;
}

const LayoutContext = createContext<LayoutContextValue | null>(null);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [rightSidebarContent, setRightSidebarContent] =
    useState<ReactNode | null>(null);

  return (
    <LayoutContext.Provider
      value={{ rightSidebarContent, setRightSidebarContent }}
    >
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error("useLayout must be used within a LayoutProvider");
  }
  return context;
}
