import { resolvePublishedVersion } from "../features/publicationResolver/client";
import {
  extractArxivID,
  type PublicationLookupInput,
  type PublishedVersion,
} from "../features/publicationResolver/core";

function safeField(item: Zotero.Item, field: string): string {
  try {
    return String(item.getField(field as never) || "").trim();
  } catch {
    return "";
  }
}

export function getPublicationLookupInput(
  item: Zotero.Item,
): PublicationLookupInput | undefined {
  const title = safeField(item, "title");
  if (!title) return undefined;
  const creator = item.getCreators()[0];
  const firstAuthor = creator
    ? [creator.firstName, creator.lastName].filter(Boolean).join(" ")
    : "";
  const date = safeField(item, "date");
  const year = date.match(/(?:19|20)\d{2}/)?.[0];
  const arxivID = extractArxivID([
    safeField(item, "archive"),
    safeField(item, "archiveLocation"),
    safeField(item, "DOI"),
    safeField(item, "url"),
    safeField(item, "extra"),
  ]);
  return { title, firstAuthor, year, arxivID };
}

export function isArxivItem(item: Zotero.Item): boolean {
  return Boolean(getPublicationLookupInput(item)?.arxivID);
}

export async function findPublishedVersion(
  item: Zotero.Item,
): Promise<PublishedVersion | undefined> {
  const input = getPublicationLookupInput(item);
  if (!input) return undefined;
  return resolvePublishedVersion(input);
}

function mergePublishedVersionBlock(
  extra: string,
  version: PublishedVersion,
): string {
  const lines = [
    `[Published Version]`,
    `Venue: ${version.venue}`,
    version.doi ? `DOI: ${version.doi}` : "",
    version.year ? `Year: ${version.year}` : "",
    `Source: ${version.source}`,
    `[/Published Version]`,
  ].filter(Boolean);
  const preserved = extra
    .replace(/\n?\[Published Version\][\s\S]*?\[\/Published Version\]\n?/gi, "")
    .trim();
  return preserved ? `${preserved}\n\n${lines.join("\n")}` : lines.join("\n");
}

function trySetField(item: Zotero.Item, field: string, value: string): boolean {
  if (!value) return false;
  try {
    item.setField(field as never, value);
    return true;
  } catch {
    return false;
  }
}

export async function applyPublishedVersion(
  item: Zotero.Item,
  version: PublishedVersion,
): Promise<void> {
  if (version.doi) trySetField(item, "DOI", version.doi);
  if (version.year && !safeField(item, "date"))
    trySetField(item, "date", version.year);
  const venueWritten =
    version.kind === "conference"
      ? trySetField(item, "conferenceName", version.venue) ||
        trySetField(item, "proceedingsTitle", version.venue)
      : trySetField(item, "publicationTitle", version.venue);
  if (
    !venueWritten ||
    Zotero.ItemTypes.getName(item.itemTypeID) === "preprint"
  ) {
    const extra = safeField(item, "extra");
    item.setField("extra", mergePublishedVersionBlock(extra, version));
  }
  await item.saveTx();
}
