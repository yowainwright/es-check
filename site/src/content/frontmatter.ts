export function extractFrontmatter(source: string) {
  const match = source.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return { frontmatter: {}, content: source };

  const entries = match[1].split("\n").flatMap(parseFrontmatterLine);
  const frontmatter = Object.fromEntries(entries);
  const content = source.slice(match[0].length);
  return { frontmatter, content };
}

function parseFrontmatterLine(line: string): [string, string][] {
  const colonIndex = line.indexOf(":");
  if (colonIndex < 1) return [];

  const key = line.slice(0, colonIndex).trim();
  const rawValue = line.slice(colonIndex + 1).trim();
  const value = rawValue.replace(/^(["'])(.*)\1$/, "$2");
  return [[key, value]];
}
