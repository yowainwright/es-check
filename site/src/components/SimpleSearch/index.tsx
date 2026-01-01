import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link } from "@tanstack/react-router";
import Fuse from "fuse.js";
import { Search, Frown } from "lucide-react";
import type { SearchItem } from "./types";
import { SEARCH_DATA, FUSE_OPTIONS } from "./constants";

const fuse = new Fuse(SEARCH_DATA, FUSE_OPTIONS);

export function SimpleSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (query.length > 1) {
      const searchResults = fuse.search(query);
      setResults(searchResults.slice(0, 8).map((result) => result.item));
    } else {
      setResults([]);
    }
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
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

  const groupedResults = results.reduce(
    (acc, item) => {
      const category = item.category || "Other";
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    },
    {} as Record<string, SearchItem[]>
  );

  return (
    <div ref={searchRef} className="relative">
      <SearchButton onClick={openSearch} />
      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <SearchModal
            query={query}
            setQuery={setQuery}
            groupedResults={groupedResults}
            inputRef={inputRef}
            onClose={closeSearch}
          />,
          document.body
        )}
    </div>
  );
}

function SearchButton({ onClick }: { onClick: () => void }) {
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
  groupedResults: Record<string, SearchItem[]>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onClose: () => void;
}

function SearchModal({ query, setQuery, groupedResults, inputRef, onClose }: SearchModalProps) {
  const hasResults = Object.keys(groupedResults).length > 0;
  const showNoResults = query.length > 1 && !hasResults;
  const showInitialState = query.length <= 1;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]" onClick={onClose} />
      <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[5vh] md:pt-[10vh] pointer-events-none">
        <div className="bg-base-100 rounded-lg md:rounded-2xl shadow-2xl border border-base-300 overflow-hidden w-full max-w-2xl mx-2 md:mx-4 pointer-events-auto">
          <SearchHeader query={query} setQuery={setQuery} inputRef={inputRef} />
          {hasResults && <SearchResults groupedResults={groupedResults} onClose={onClose} />}
          {showNoResults && <NoResults query={query} />}
          {showInitialState && <InitialState />}
        </div>
      </div>
    </>
  );
}

interface SearchHeaderProps {
  query: string;
  setQuery: (query: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

function SearchHeader({ query, setQuery, inputRef }: SearchHeaderProps) {
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
          onChange={(e) => setQuery(e.target.value)}
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

interface SearchResultsProps {
  groupedResults: Record<string, SearchItem[]>;
  onClose: () => void;
}

function SearchResults({ groupedResults, onClose }: SearchResultsProps) {
  return (
    <div className="max-h-[50vh] md:max-h-[60vh] overflow-y-auto">
      {Object.entries(groupedResults).map(([category, items]) => (
        <div key={category}>
          <div className="px-4 pt-3 pb-2">
            <div className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">{category}</div>
          </div>
          {items.map((result, index) => (
            <Link
              key={`${category}-${index}`}
              to={result.href}
              className="block px-4 py-3 hover:bg-primary/10 focus:bg-primary/10 focus:outline-none transition-colors border-l-2 border-transparent hover:border-primary focus:border-primary"
              onClick={onClose}
            >
              <div className="font-medium text-base-content">{result.title}</div>
              <div className="text-sm text-base-content/60 mt-0.5">{result.description}</div>
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
}

function NoResults({ query }: { query: string }) {
  return (
    <div className="p-12 text-center">
      <Frown className="h-12 w-12 mx-auto text-base-content/20 mb-4" />
      <div className="text-base-content/60">No results found for "{query}"</div>
      <div className="text-sm text-base-content/40 mt-2">Try searching for "installation" or "configuration"</div>
    </div>
  );
}

function InitialState() {
  return (
    <div className="p-12 text-center">
      <div className="text-base-content/60">Start typing to search...</div>
      <div className="text-sm text-base-content/40 mt-2">Search docs, commands, and features</div>
      <div className="flex justify-center gap-6 mt-6">
        <KeyboardHint keys="↑↓" label="Navigate" />
        <KeyboardHint keys="↵" label="Select" />
        <KeyboardHint keys="ESC" label="Close" />
      </div>
    </div>
  );
}

function KeyboardHint({ keys, label }: { keys: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-base-content/40">
      <kbd className="px-1.5 py-0.5 text-xs rounded border border-base-300 bg-base-200 font-mono">{keys}</kbd>
      <span>{label}</span>
    </div>
  );
}
