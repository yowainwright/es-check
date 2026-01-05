export interface SearchItem {
  title: string;
  description: string;
  href: string;
  content: string;
  category?: string;
}

export type SearchVariant = "default" | "compact";

export interface SimpleSearchProps {
  variant?: SearchVariant;
}

export interface SearchButtonProps {
  onClick: () => void;
  variant: SearchVariant;
}
