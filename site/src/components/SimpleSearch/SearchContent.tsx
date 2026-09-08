import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import Fuse from "fuse.js";
import { Frown } from "lucide-react";
import type { SearchItem } from "./types";
import { SEARCH_DATA, FUSE_OPTIONS } from "./constants";

const fuse = new Fuse(SEARCH_DATA, FUSE_OPTIONS);

interface SearchContentProps {
  query: string;
  onClose: () => void;
}

export function SearchContent({ query, onClose }: SearchContentProps) {
  const results = useMemo(() => {
    const searchQuery = query.trim();
    if (searchQuery.length < 2) return [];
    return fuse.search(searchQuery, { limit: 8 }).map((result) => result.item);
  }, [query]);
  const hasQuery = query.trim().length > 1;
  if (!hasQuery) return <InitialState />;
  if (results.length === 0) return <NoResults query={query} />;
  const groupedResults = groupResults(results);
  return <SearchResults groupedResults={groupedResults} onClose={onClose} />;
}

function groupResults(results: SearchItem[]): Record<string, SearchItem[]> {
  return results.reduce<Record<string, SearchItem[]>>((groups, item) => {
    const category = item.category || "Other";
    const group = groups[category] || [];
    groups[category] = group.concat(item);
    return groups;
  }, {});
}

interface SearchResultsProps {
  groupedResults: Record<string, SearchItem[]>;
  onClose: () => void;
}

function SearchResults({ groupedResults, onClose }: SearchResultsProps) {
  const groups = Object.entries(groupedResults).map(([category, items]) => (
    <SearchResultGroup key={category} category={category} items={items} onClose={onClose} />
  ));
  return <div className="max-h-[50vh] md:max-h-[60vh] overflow-y-auto">{groups}</div>;
}

interface SearchResultGroupProps {
  category: string;
  items: SearchItem[];
  onClose: () => void;
}

function SearchResultGroup({ category, items, onClose }: SearchResultGroupProps) {
  const links = items.map((result) => (
    <SearchResultLink key={result.href} result={result} onClose={onClose} />
  ));
  return (
    <div>
      <div className="px-4 pt-3 pb-2">
        <div className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">
          {category}
        </div>
      </div>
      {links}
    </div>
  );
}

function SearchResultLink({ result, onClose }: { result: SearchItem; onClose: () => void }) {
  return (
    <Link
      to={result.href}
      className="block px-4 py-3 hover:bg-primary/10 focus:bg-primary/10 focus:outline-none transition-colors border-l-2 border-transparent hover:border-primary focus:border-primary"
      onClick={onClose}
    >
      <div className="font-medium text-base-content">{result.title}</div>
      <div className="text-sm text-base-content/60 mt-0.5">{result.description}</div>
    </Link>
  );
}

function NoResults({ query }: { query: string }) {
  return (
    <div className="p-12 text-center">
      <Frown className="h-12 w-12 mx-auto text-base-content/20 mb-4" />
      <div className="text-base-content/60">No results found for "{query}"</div>
      <div className="text-sm text-base-content/40 mt-2">
        Try searching for "installation" or "configuration"
      </div>
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
      <kbd className="px-1.5 py-0.5 text-xs rounded border border-base-300 bg-base-200 font-mono">
        {keys}
      </kbd>
      <span>{label}</span>
    </div>
  );
}
