import type { CardId } from "./card-id.js";
import { apiFailure } from "./errors.js";
import type { Session } from "./session.js";

export const CARD_SEARCH_LIMIT = 50;

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

async function readTitles(
  session: Session,
  like: string,
  regex: string,
  limit: number,
): Promise<CardRow[]> {
  const { data, error, status } = await session.client
    .from("cards")
    .select("id, wikipedia_title, rarity")
    .ilike("wikipedia_title", like)
    .filter("wikipedia_title", "imatch", regex)
    .order("wikipedia_title")
    .order("id")
    .limit(limit)
    .overrideTypes<CardRow[], { merge: false }>();
  if (error) {
    throw apiFailure("Searching the card catalogue", status, error.message);
  }
  return data;
}

export async function searchCards(
  session: Session,
  name: string,
): Promise<CardSearch> {
  const like = likePattern(name);
  const regex = regexLiteral(name);
  const containing = await readTitles(
    session,
    `%${like}%`,
    regex,
    CARD_SEARCH_LIMIT + 1,
  );
  const truncated = containing.length > CARD_SEARCH_LIMIT;
  const exact = truncated
    ? await readTitles(session, like, `^${regex}$`, CARD_SEARCH_LIMIT)
    : containing.filter(
        ({ wikipedia_title }) =>
          wikipedia_title.toLowerCase() === name.toLowerCase(),
      );

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
