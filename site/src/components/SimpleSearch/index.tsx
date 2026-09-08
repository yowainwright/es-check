import { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import { createPortal } from "react-dom";
import { Search } from "lucide-react";
import type { SimpleSearchProps, SearchButtonProps } from "./types";

export type { SimpleSearchProps } from "./types";

const SearchContent = lazy(() =>
  import("./SearchContent").then((module) => ({ default: module.SearchContent })),
);

export function SimpleSearch({ variant = "default" }: SimpleSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isSearchShortcut = (e.metaKey || e.ctrlKey) && e.key === "k";
      if (isSearchShortcut) {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const openSearch = useCallback(() => {
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const closeSearch = useCallback(() => {
    setIsOpen(false);
    setQuery("");
  }, []);

  const canShowSearch = isOpen && typeof document !== "undefined";
  const modal = (
    <SearchModal query={query} setQuery={setQuery} inputRef={inputRef} onClose={closeSearch} />
  );
  const searchModal = canShowSearch ? modal : null;

  return (
    <div ref={searchRef} className="relative">
      <SearchButton onClick={openSearch} variant={variant} />
      {searchModal}
    </div>
  );
}

function SearchButton({ onClick, variant }: SearchButtonProps) {
  if (variant === "compact") {
    return (
      <button
        onClick={onClick}
        className="btn btn-ghost btn-sm gap-1.5 font-normal"
        aria-label="Search"
      >
        <Search className="h-4 w-4" />
        <kbd className="text-xs text-base-content/60 font-mono">⌘K</kbd>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 bg-base-200/50 hover:bg-base-200 rounded-lg transition-all duration-200 min-w-[140px] md:min-w-[200px] text-left"
    >
      <Search className="h-4 w-4 text-base-content/50" />
      <span className="text-xs md:text-sm text-base-content/50 flex-1">Search...</span>
      <kbd className="hidden md:flex px-1.5 py-0.5 text-xs rounded border border-base-300 bg-base-100 font-mono text-base-content/70">
        <span className="text-sm">⌘</span> K
      </kbd>
    </button>
  );
}

interface SearchModalProps {
  query: string;
  setQuery: (query: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onClose: () => void;
}

function SearchModal({ query, setQuery, inputRef, onClose }: SearchModalProps) {
  const loading = (
    <div className="p-12 text-center text-base-content/60" role="status">
      Loading search...
    </div>
  );
  const modal = (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]" onClick={onClose} />
      <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[5vh] md:pt-[10vh] pointer-events-none">
        <div className="bg-base-100 rounded-lg md:rounded-2xl shadow-2xl border border-base-300 overflow-hidden w-full max-w-2xl mx-2 md:mx-4 pointer-events-auto">
          <SearchHeader query={query} setQuery={setQuery} inputRef={inputRef} />
          <Suspense fallback={loading}>
            <SearchContent query={query} onClose={onClose} />
          </Suspense>
        </div>
      </div>
    </>
  );
  return createPortal(modal, document.body);
}

interface SearchHeaderProps {
  query: string;
  setQuery: (query: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

function SearchHeader({ query, setQuery, inputRef }: SearchHeaderProps) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="relative">
        <Search className="h-6 w-6 absolute left-5 top-1/2 -translate-y-1/2 text-primary" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search documentation..."
          className="w-full pl-12 md:pl-14 pr-16 md:pr-20 py-3 md:py-4 bg-transparent border-0 text-base md:text-lg font-medium placeholder:text-base-content/40 focus:outline-none"
          value={query}
          onChange={handleChange}
          autoFocus
        />
        <div className="absolute right-5 top-1/2 -translate-y-1/2">
          <kbd className="px-2 py-1 text-sm rounded border border-base-300 bg-base-200 font-mono text-base-content/70">
            ESC
          </kbd>
        </div>
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-base-300 to-transparent mt-4 md:mt-6" />
    </div>
  );
}
