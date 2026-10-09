import type { CardId } from "./card-id.js";
import { apiFailure, WikiMastersError } from "./errors.js";
import type { Session } from "./session.js";

export const CARD_SEARCH_LIMIT = 50;

export const CARD_SEARCH_FIELDS = ["title", "category", "summary"] as const;

export type CardSearchField = (typeof CARD_SEARCH_FIELDS)[number];

const SEARCHED_COLUMNS = {
  title: "wikipedia_title",
  category: "category",
  summary: "summary",
} as const satisfies Record<CardSearchField, string>;

type SearchedColumn = (typeof SEARCHED_COLUMNS)[CardSearchField];

function isCardSearchField(raw: string): raw is CardSearchField {
  return (CARD_SEARCH_FIELDS as readonly string[]).includes(raw);
}

export function parseCardSearchField(raw: string): CardSearchField {
  if (!isCardSearchField(raw)) {
    throw new WikiMastersError(
      `Invalid field: ${JSON.stringify(raw)} is not one of ${CARD_SEARCH_FIELDS.join(", ")}; nothing was read`,
    );
  }
  return raw;
}

export interface CatalogueCard {
  id: CardId;
  title: string;
  rarity: string;
}

export interface CardSearch {
  cards: CatalogueCard[];
  truncated: boolean;
}

interface CardRow {
  id: string;
  wikipedia_title: string;
  rarity: string;
}

// PostgREST turns every `*` of a like pattern into `%`, escaped or not
// (https://docs.postgrest.org/en/stable/references/api/tables_views.html#operators).
function likePattern(text: string): string {
  return text.replace(/[\\%_]/g, "\\$&").replaceAll("*", "_");
}

function regexLiteral(text: string): string {
  return text.replace(/[\\^$.|?*+()[\]{}]/g, "\\$&");
}

async function readCards(
  session: Session,
  column: SearchedColumn,
  like: string,
  regex: string,
  limit: number,
): Promise<CardRow[]> {
  const { data, error, status } = await session.client
    .from("cards")
    .select("id, wikipedia_title, rarity")
    .ilike(column, like)
    .filter(column, "imatch", regex)
    .order("wikipedia_title")
    .order("id")
    .limit(limit)
    .overrideTypes<CardRow[], { merge: false }>();
  if (error) {
    throw apiFailure("Searching the card catalogue", status, error.message);
  }
  return data;
}

async function exactTitles(
  session: Session,
  title: string,
  containing: CardRow[],
): Promise<CardRow[]> {
  if (containing.length <= CARD_SEARCH_LIMIT) {
    return containing.filter(
      ({ wikipedia_title }) =>
        wikipedia_title.toLowerCase() === title.toLowerCase(),
    );
  }
  return readCards(
    session,
    SEARCHED_COLUMNS.title,
    likePattern(title),
    `^${regexLiteral(title)}$`,
    CARD_SEARCH_LIMIT,
  );
}

export async function searchCards(
  session: Session,
  text: string,
  field: CardSearchField,
): Promise<CardSearch> {
  const containing = await readCards(
    session,
    SEARCHED_COLUMNS[field],
    `%${likePattern(text)}%`,
    regexLiteral(text),
    CARD_SEARCH_LIMIT + 1,
  );
  const truncated = containing.length > CARD_SEARCH_LIMIT;
  const exact =
    field === "title" ? await exactTitles(session, text, containing) : [];

  const exactIds = new Set(exact.map(({ id }) => id));
  const rows = [...exact, ...containing.filter(({ id }) => !exactIds.has(id))];
  return {
    cards: rows
      .slice(0, CARD_SEARCH_LIMIT)
      .map(({ id, wikipedia_title, rarity }) => ({
        id: id as CardId,
        title: wikipedia_title,
        rarity,
      })),
    truncated,
  };
}
