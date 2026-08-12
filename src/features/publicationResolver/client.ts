import type { HttpClient } from "../../platform/zoteroServices";
import { zoteroHttpClient } from "../../platform/zoteroServices";
import {
  parseArxivMetadata,
  scorePublishedVersion,
  type PublicationLookupInput,
  type PublishedVersion,
} from "./core";

interface CrossrefWork {
  DOI?: string;
  title?: string[];
  "container-title"?: string[];
  author?: Array<{ given?: string; family?: string }>;
  type?: string;
  published?: { "date-parts"?: number[][] };
}

interface OpenAlexWork {
  title?: string;
  doi?: string;
  publication_year?: number;
  type?: string;
  primary_location?: { source?: { display_name?: string; type?: string } };
  authorships?: Array<{ author?: { display_name?: string } }>;
}

function fromCrossref(
  input: PublicationLookupInput,
  work: CrossrefWork,
): PublishedVersion | undefined {
  const title = work.title?.[0] || "";
  const venue = work["container-title"]?.[0] || "";
  if (
    !title ||
    !venue ||
    work.type === "posted-content" ||
    /^(?:arxiv|corr)$/i.test(venue.trim()) ||
    work.DOI?.toLocaleLowerCase().startsWith("10.48550/arxiv.")
  )
    return undefined;
  const year = work.published?.["date-parts"]?.[0]?.[0]?.toString();
  return {
    title,
    venue,
    doi: work.DOI,
    year,
    kind: work.type?.includes("proceedings") ? "conference" : "journal",
    source: "crossref",
    confidence: scorePublishedVersion(input, {
      title,
      year,
      authors: work.author?.map(
        (author) => `${author.given || ""} ${author.family || ""}`,
      ),
    }),
  };
}

async function queryCrossref(
  input: PublicationLookupInput,
  doi: string | undefined,
  http: HttpClient,
): Promise<PublishedVersion[]> {
  const url = doi
    ? `https://api.crossref.org/works/${encodeURIComponent(doi)}`
    : `https://api.crossref.org/works?query.title=${encodeURIComponent(input.title)}&query.author=${encodeURIComponent(input.firstAuthor)}&rows=5`;
  const response = await http.request<{
    message?: CrossrefWork | { items?: CrossrefWork[] };
  }>("GET", url, { responseType: "json", timeout: 30000 });
  const message = response.response.message;
  const works =
    message && "items" in message
      ? message.items || []
      : message
        ? [message as CrossrefWork]
        : [];
  return works.flatMap((work) => {
    const candidate = fromCrossref(input, work);
    if (!candidate) return [];
    if (doi) candidate.confidence = 1;
    return [candidate];
  });
}

async function queryOpenAlex(
  input: PublicationLookupInput,
  http: HttpClient,
): Promise<PublishedVersion[]> {
  const url = `https://api.openalex.org/works?search=${encodeURIComponent(input.title)}&per-page=5`;
  const response = await http.request<{ results?: OpenAlexWork[] }>(
    "GET",
    url,
    {
      responseType: "json",
      timeout: 30000,
    },
  );
  return (response.response.results || []).flatMap((work) => {
    const title = work.title || "";
    const venue = work.primary_location?.source?.display_name || "";
    if (
      !title ||
      !venue ||
      work.type === "preprint" ||
      /^(?:arxiv|corr)$/i.test(venue.trim())
    )
      return [];
    const year = work.publication_year?.toString();
    return [
      {
        title,
        venue,
        doi: work.doi?.replace(/^https?:\/\/doi\.org\//i, ""),
        year,
        kind: work.type?.includes("article")
          ? ("journal" as const)
          : ("unknown" as const),
        source: "openalex" as const,
        confidence: scorePublishedVersion(input, {
          title,
          year,
          authors: work.authorships?.map(
            (entry) => entry.author?.display_name || "",
          ),
        }),
      },
    ];
  });
}

export async function resolvePublishedVersion(
  input: PublicationLookupInput,
  http: HttpClient = zoteroHttpClient,
): Promise<PublishedVersion | undefined> {
  let arxivDoi: string | undefined;
  let journalRef: string | undefined;
  if (input.arxivID) {
    try {
      const response = await http.request<string>(
        "GET",
        `https://export.arxiv.org/api/query?id_list=${encodeURIComponent(input.arxivID)}`,
        { responseType: "text", timeout: 30000 },
      );
      ({ doi: arxivDoi, journalRef } = parseArxivMetadata(response.response));
    } catch {
      // Crossref/OpenAlex title matching below remains available.
    }
  }
  let candidates: PublishedVersion[];
  try {
    candidates = await queryCrossref(input, arxivDoi, http);
  } catch {
    candidates = [];
  }
  if (!candidates.length) {
    try {
      candidates = await queryOpenAlex(input, http);
    } catch {
      candidates = [];
    }
  }
  const best = candidates.sort((a, b) => b.confidence - a.confidence)[0];
  if (best && best.confidence >= 0.82) return best;
  if (journalRef) {
    return {
      title: input.title,
      venue: journalRef,
      doi: arxivDoi,
      year: input.year,
      kind: "unknown",
      source: "arxiv",
      confidence: 0.9,
    };
  }
  return undefined;
}
