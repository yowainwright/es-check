export interface Heading {
  depth: number;
  slug: string;
  text: string;
  subheadings?: Heading[];
}

export interface TableOfContentsProps {
  headings: Heading[];
}
