/**
 * Firestore schema-definitioner
 * 
 * Denna modul definierar alla Firestore collections och deras dokumentstrukturer.
 * Används för type-safety och dokumentation av databasstrukturen.
 * 
 * @module schema
 */

/**
 * Firestore collection-namn
 */
export const COLLECTIONS = {
  /** Posts (API-nyheter från providers) */
  posts: 'posts',
  /** Tutorials (tutorials för API-releases) */
  tutorials: 'tutorials',
  /** News (allmänna AI-nyheter) */
  news: 'news',
  /** User questions (användarfrågor från chatten) */
  user_questions: 'user_questions',
  /** Error logs (felrapporter från agenter) */
  errorLogs: 'errorLogs'
} as const;

/** Type för collection-namn */
export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];

/**
 * Dokumentstruktur för posts
 */
export interface PostDoc {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  provider: string;
  sourceUrl: string;
  linkedinUrn: string;
  createdAt: any;
  updatedAt: any;
}

/**
 * Dokumentstruktur för tutorials
 */
export interface TutorialDoc {
  postId: string;
  title: string;
  content: string;
  sourceUrl: string;
  createdAt: any;
  updatedAt: any;
}

/**
 * Dokumentstruktur för news
 */
export interface NewsDoc {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  sourceUrl: string;
  source: string; // RSS-feed källa
  linkedinUrn: string;
  createdAt: any;
  updatedAt: any;
}

/**
 * Dokumentstruktur för user questions
 */
export interface UserQuestionDoc {
  question: string;
  sessionId?: string; // Valfritt för anonyma användare
  createdAt: any;
}

/**
 * Dokumentstruktur för error logs
 */
export interface ErrorLogDoc {
  timestamp: any; // Firestore server timestamp
  context: string; // Vilken agent/handler (t.ex. "apiNewsHandler", "generalNewsHandler")
  message: string; // Felmeddelande
  stack: string | null; // Stack trace om tillgänglig
  metadata: Record<string, any>; // Extra information (t.ex. force flag, processed count, etc.)
  severity: 'error' | 'warning'; // Feltyp
}

