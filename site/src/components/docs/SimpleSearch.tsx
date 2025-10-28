import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Fuse from "fuse.js";
import { searchData, type SearchItem } from "./SearchData";
import { getUrl } from "../../utils/url";

export function SimpleSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize Fuse.js with comprehensive search options
  const fuse = new Fuse(searchData, {
    keys: [
      { name: "title", weight: 0.4 },
      { name: "description", weight: 0.3 },
      { name: "content", weight: 0.2 },
      { name: "category", weight: 0.1 },
    ],
    threshold: 0.3,
    includeScore: true,
    minMatchCharLength: 2,
  });

  useEffect(() => {
    if (query.length > 1) {
      const searchResults = fuse.search(query);
      setResults(searchResults.slice(0, 8).map((result) => result.item));
    } else {
      setResults([]);
    }
  }, [query]);

  // Remove the click outside handler as we're using a backdrop now

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

  // Group results by category
  const groupedResults = results.reduce(
    (acc, item) => {
      const category = item.category || "Other";
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    },
    {} as Record<string, SearchItem[]>,
  );

  return (
    <div ref={searchRef} className="relative">
      <button
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
        className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 bg-base-200/50 hover:bg-base-200 rounded-lg transition-all duration-200 min-w-[140px] md:min-w-[200px] text-left"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 text-base-content/50"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <span className="text-xs md:text-sm text-base-content/50 flex-1">
          Search...
        </span>
        <kbd className="hidden md:flex px-1.5 py-0.5 text-xs rounded border border-base-300 bg-base-100 font-mono text-base-content/70">
          <span className="text-sm">⌘</span> K
        </kbd>
      </button>

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            {/* Full page backdrop */}
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
              onClick={() => setIsOpen(false)}
            />

            {/* Centered modal */}
            <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[5vh] md:pt-[10vh] pointer-events-none">
              <div className="bg-base-100 rounded-lg md:rounded-2xl shadow-2xl border border-base-300 overflow-hidden w-full max-w-2xl mx-2 md:mx-4 pointer-events-auto">
                {/* Search header */}
                <div className="p-4 md:p-6">
                  <div className="relative">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 absolute left-5 top-1/2 -translate-y-1/2 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
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
                  <div className="h-px bg-gradient-to-r from-transparent via-base-300 to-transparent mt-4 md:mt-6"></div>
                </div>

                {/* Search results */}
                {Object.keys(groupedResults).length > 0 && (
                  <div className="max-h-[50vh] md:max-h-[60vh] overflow-y-auto">
                    {Object.entries(groupedResults).map(([category, items]) => (
                      <div key={category}>
                        <div className="px-4 pt-3 pb-2">
                          <div className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">
                            {category}
                          </div>
                        </div>
                        {items.map((result, index) => (
                          <a
                            key={`${category}-${index}`}
                            href={getUrl(result.href)}
                            className="block px-4 py-3 hover:bg-primary/10 focus:bg-primary/10 focus:outline-none transition-colors border-l-2 border-transparent hover:border-primary focus:border-primary"
                            onClick={() => {
                              setIsOpen(false);
                              setQuery("");
                            }}
                          >
                            <div className="font-medium text-base-content">
                              {result.title}
                            </div>
                            <div className="text-sm text-base-content/60 mt-0.5">
                              {result.description}
                            </div>
                          </a>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {/* No results state */}
                {query.length > 1 &&
                  Object.keys(groupedResults).length === 0 && (
                    <div className="p-12 text-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-12 w-12 mx-auto text-base-content/20 mb-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div className="text-base-content/60">
                        No results found for "{query}"
                      </div>
                      <div className="text-sm text-base-content/40 mt-2">
                        Try searching for "installation" or "configuration"
                      </div>
                    </div>
                  )}

                {/* Initial state */}
                {query.length <= 1 && (
                  <div className="p-12 text-center">
                    <div className="text-base-content/60">
                      Start typing to search...
                    </div>
                    <div className="text-sm text-base-content/40 mt-2">
                      Search docs, commands, and features
                    </div>
                    <div className="flex justify-center gap-6 mt-6">
                      <div className="flex items-center gap-2 text-xs text-base-content/40">
                        <kbd className="px-1.5 py-0.5 text-xs rounded border border-base-300 bg-base-200 font-mono">
                          ↑↓
                        </kbd>
                        <span>Navigate</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-base-content/40">
                        <kbd className="px-1.5 py-0.5 text-xs rounded border border-base-300 bg-base-200 font-mono">
                          ↵
                        </kbd>
                        <span>Select</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-base-content/40">
                        <kbd className="px-1.5 py-0.5 text-xs rounded border border-base-300 bg-base-200 font-mono">
                          ESC
                        </kbd>
                        <span>Close</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}
