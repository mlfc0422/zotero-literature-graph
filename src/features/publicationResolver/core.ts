export interface PublicationLookupInput {
  title: string;
  firstAuthor: string;
  year?: string;
  arxivID?: string;
}

export interface PublishedVersion {
  title: string;
  doi?: string;
  venue: string;
  year?: string;
  kind: "journal" | "conference" | "unknown";
  source: "arxiv" | "crossref" | "openalex";
  confidence: number;
}

export function extractArxivID(values: string[]): string | undefined {
  for (const value of values) {
    const match = value.match(
      /(?:arxiv\s*:\s*|arxiv\.org\/(?:abs|pdf)\/|10\.48550\/arxiv\.)([a-z-]+(?:\.[A-Z]{2})?\/\d{7}|\d{4}\.\d{4,5})(?:v\d+)?/i,
    );
    if (match) return match[1];
  }
  return undefined;
}

function decodeXml(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

export function parseArxivMetadata(xml: string): {
  doi?: string;
  journalRef?: string;
} {
  const read = (tag: string) => {
    const match = xml.match(
      new RegExp(`<arxiv:${tag}[^>]*>([\\s\\S]*?)<\\/arxiv:${tag}>`, "i"),
    );
    return match ? decodeXml(match[1].replace(/\s+/g, " ").trim()) : undefined;
  };
  return { doi: read("doi"), journalRef: read("journal_ref") };
}

export function normalizePublicationTitle(value: string): string {
  return value
    .normalize("NFKD")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export function titleSimilarity(left: string, right: string): number {
  const a = normalizePublicationTitle(left);
  const b = normalizePublicationTitle(right);
  if (!a || !b) return 0;
  if (a === b) return 1;
  const aTokens = new Set(a.split(" "));
  const bTokens = new Set(b.split(" "));
  const intersection = [...aTokens].filter((token) =>
    bTokens.has(token),
  ).length;
  return intersection / new Set([...aTokens, ...bTokens]).size;
}

export function scorePublishedVersion(
  input: PublicationLookupInput,
  candidate: Pick<PublishedVersion, "title" | "year"> & { authors?: string[] },
): number {
  const title = titleSimilarity(input.title, candidate.title);
  const surname = normalizePublicationTitle(input.firstAuthor)
    .split(" ")
    .at(-1);
  const author =
    surname &&
    candidate.authors?.some((name) =>
      normalizePublicationTitle(name).split(" ").includes(surname),
    )
      ? 1
      : 0;
  const year =
    input.year && candidate.year && input.year === candidate.year ? 1 : 0;
  return Math.min(1, title * 0.85 + author * 0.1 + year * 0.05);
}
