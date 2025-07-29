import { useState, useEffect, useRef } from 'react';
import Fuse from 'fuse.js';
import { searchData, type SearchItem } from './SearchData';

export function SimpleSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchItem[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize Fuse.js with comprehensive search options
  const fuse = new Fuse(searchData, {
    keys: [
      { name: 'title', weight: 0.4 },
      { name: 'description', weight: 0.3 },
      { name: 'content', weight: 0.2 },
      { name: 'category', weight: 0.1 }
    ],
    threshold: 0.3,
    includeScore: true,
    minMatchCharLength: 2,
  });

  useEffect(() => {
    if (query.length > 1) {
      const searchResults = fuse.search(query);
      setResults(searchResults.slice(0, 8).map(result => result.item));
    } else {
      setResults([]);
    }
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Group results by category
  const groupedResults = results.reduce((acc, item) => {
    const category = item.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, SearchItem[]>);

  return (
    <div ref={searchRef} className="relative">
      <button
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
        className="btn btn-sm btn-ghost gap-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="hidden sm:inline">Search</span>
        <kbd className="kbd kbd-sm hidden sm:inline-flex">⌘K</kbd>
      </button>

      {isOpen && (
        <div className="absolute top-12 right-0 w-96 z-50">
          <div className="bg-base-100 rounded-lg shadow-2xl border border-base-300 overflow-hidden">
            <div className="p-4 border-b border-base-300">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search documentation..."
                  className="input input-bordered w-full pr-10"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs opacity-60">
                  <kbd className="kbd kbd-xs">ESC</kbd>
                </div>
              </div>
            </div>
            
            {Object.keys(groupedResults).length > 0 && (
              <div className="max-h-96 overflow-y-auto">
                {Object.entries(groupedResults).map(([category, items]) => (
                  <div key={category} className="px-4 py-2">
                    <div className="text-xs font-semibold opacity-60 mb-2">{category}</div>
                    {items.map((result, index) => (
                      <a
                        key={`${category}-${index}`}
                        href={result.href}
                        className="block p-3 hover:bg-base-200 rounded-lg -mx-2 mb-1"
                        onClick={() => {
                          setIsOpen(false);
                          setQuery('');
                        }}
                      >
                        <div className="font-semibold text-sm">{result.title}</div>
                        <div className="text-xs opacity-70 mt-1">{result.description}</div>
                      </a>
                    ))}
                  </div>
                ))}
              </div>
            )}
            
            {query.length > 1 && Object.keys(groupedResults).length === 0 && (
              <div className="p-8 text-center">
                <div className="opacity-60">No results found for "{query}"</div>
                <div className="text-sm opacity-40 mt-2">Try searching for "installation" or "configuration"</div>
              </div>
            )}

            {query.length <= 1 && (
              <div className="p-8 text-center">
                <div className="opacity-60">Start typing to search...</div>
                <div className="text-sm opacity-40 mt-2">Search docs, commands, and features</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}