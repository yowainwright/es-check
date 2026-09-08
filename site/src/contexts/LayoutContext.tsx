import { createContext, useContext, useState, type ReactNode } from "react";

interface LayoutContextValue {
  rightSidebarContent: ReactNode | null;
  setRightSidebarContent: (content: ReactNode | null) => void;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
}

const LayoutContext = createContext<LayoutContextValue | null>(null);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [rightSidebarContent, setRightSidebarContent] = useState<ReactNode | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const value = { rightSidebarContent, setRightSidebarContent, menuOpen, setMenuOpen };

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error("useLayout must be used within a LayoutProvider");
  }
  return context;
}
