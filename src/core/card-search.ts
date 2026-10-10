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

export async function searchCards(
  session: Session,
  text: string,
  field: CardSearchField,
): Promise<CardSearch> {
  const column = SEARCHED_COLUMNS[field];
  const { data, error, status } = await session.client
    .from("cards")
    .select("id, wikipedia_title, rarity")
    .ilike(column, `%${likePattern(text)}%`)
    .filter(column, "imatch", regexLiteral(text))
    .order("wikipedia_title")
    .order("id")
    .limit(CARD_SEARCH_LIMIT + 1)
    .overrideTypes<CardRow[], { merge: false }>();
  if (error) {
    throw apiFailure("Searching the card catalogue", status, error.message);
  }
  return {
    cards: data
      .slice(0, CARD_SEARCH_LIMIT)
      .map(({ id, wikipedia_title, rarity }) => ({
        id: id as CardId,
        title: wikipedia_title,
        rarity,
      })),
    truncated: data.length > CARD_SEARCH_LIMIT,
  };
}
