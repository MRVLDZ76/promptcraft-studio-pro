const BASE_URL = 'https://bible.helloao.org/api';

export interface Translation {
  id: string;
  name: string;
  englishName: string;
  language: string;
}

export interface BibleBook {
  id: string;
  name: string;
  numberOfChapters: number;
}

/**
 * Fetch available translations to ensure we use a valid ID.
 */
export const getTranslations = async (): Promise<Translation[]> => {
  try {
    const res = await fetch(`${BASE_URL}/available_translations.json`);
    if (!res.ok) throw new Error("Failed to fetch translations");
    const data = await res.json();
    return data.translations;
  } catch (e) {
    console.error("Error fetching translations", e);
    return [];
  }
}

/**
 * Fetch list of books for a specific translation ID
 */
export const getBooks = async (translationId: string): Promise<BibleBook[]> => {
  try {
    const res = await fetch(`${BASE_URL}/${translationId}/books.json`);
    if (!res.ok) {
      throw new Error(`Failed to fetch books for ${translationId}: ${res.status}`);
    }
    const data = await res.json();
    return data.books;
  } catch (e) {
    console.error("Error fetching Bible books", e);
    return [];
  }
};

/**
 * Fetch and parse chapter content
 */
export const getChapter = async (translationId: string, bookId: string, chapter: number): Promise<string> => {
  try {
    const res = await fetch(`${BASE_URL}/${translationId}/${bookId}/${chapter}.json`);
    if (!res.ok) {
      throw new Error(`Failed to fetch chapter: ${res.status}`);
    }
    const data = await res.json();
    return parseChapterText(data);
  } catch (e) {
    console.error("Error fetching chapter", e);
    throw new Error("Failed to fetch scripture content.");
  }
};

/**
 * Robust parser based on HelloAO API Structure
 */
const parseChapterText = (data: any): string => {
    if (!data.chapter || !data.chapter.content) return "";
    
    const extract = (node: any): string => {
        if (!node) return '';
        if (typeof node === 'string') return node;
        if (Array.isArray(node)) return node.map(extract).join('');
        
        if (node.type === 'verse') {
             return ` [${node.number}] ${extract(node.content)}`;
        }
        if (node.type === 'heading') {
             return `\n\n### ${extract(node.content)}\n`;
        }
        if (node.type === 'line_break') {
            return '\n';
        }
        if (node.type === 'hebrew_subtitle') {
             return `\n[Subtitle: ${extract(node.content)}]\n`;
        }
        if (node.text) return node.text;
        if (node.heading) return node.heading;
        if (node.lineBreak) return '\n';
        if (node.noteId !== undefined) return '';
        if (node.content) return extract(node.content);
        
        return '';
    };

    return extract(data.chapter.content).trim();
};
