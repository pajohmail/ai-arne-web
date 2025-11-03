import { fetchWithTimeout, getJsonCached } from './fetch';

export type TimestampLike = string | undefined;

export interface PostDoc {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  content?: string;
  provider?: string;
  sourceUrl?: string;
  linkedinUrn?: string;
  createdAt?: TimestampLike;
  updatedAt?: TimestampLike;
}

export interface NewsDoc {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  content?: string;
  sourceUrl?: string;
  source?: string;
  linkedinUrn?: string;
  createdAt?: TimestampLike;
  updatedAt?: TimestampLike;
}

export interface TutorialDoc {
  id: string;
  postId: string;
  title: string;
  content?: string;
  sourceUrl?: string;
  createdAt?: TimestampLike;
  updatedAt?: TimestampLike;
}

type WhereEq = { field: string; value: string };

export interface QueryArgs {
  collectionId: 'posts' | 'news' | 'tutorials';
  whereEq?: WhereEq;
  orderByCreatedAtDesc?: boolean;
  limit?: number;
  offset?: number;
}

async function fetchFromPhpApi(endpoint: string, params: Record<string, string | number> = {}): Promise<any> {
  const queryString = new URLSearchParams(
    Object.entries(params).reduce((acc, [k, v]) => {
      acc[k] = String(v);
      return acc;
    }, {} as Record<string, string>)
  ).toString();
  
  const url = `/api/${endpoint}${queryString ? '?' + queryString : ''}`;
  const key = `php:${url}`;
  
  return getJsonCached(key, async () => {
    const res = await fetchWithTimeout(url, {
      method: 'GET',
      timeoutMs: 15000,
    });
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(error.error || `HTTP ${res.status}`);
    }
    
    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error || 'Okänt fel från API');
    }
    
    return json.data;
  });
}

export async function queryCollection(args: QueryArgs): Promise<any[]> {
  const limit = args.limit ?? 10;
  
  // Hämta lista av posts
  if (args.collectionId === 'posts' && !args.whereEq && args.orderByCreatedAtDesc) {
    return fetchFromPhpApi('posts.php', { limit });
  }
  
  // Hämta lista av news
  if (args.collectionId === 'news' && !args.whereEq && args.orderByCreatedAtDesc) {
    return fetchFromPhpApi('news.php', { limit });
  }
  
  // Hämta lista av tutorials
  if (args.collectionId === 'tutorials' && !args.whereEq && args.orderByCreatedAtDesc) {
    return fetchFromPhpApi('tutorials.php', { limit });
  }
  
  // Hämta post via slug
  if (args.collectionId === 'posts' && args.whereEq?.field === 'slug') {
    const data = await fetchFromPhpApi('post.php', { slug: args.whereEq.value });
    return [data]; // Returnera som array för kompatibilitet
  }
  
  // Hämta news via slug
  if (args.collectionId === 'news' && args.whereEq?.field === 'slug') {
    const data = await fetchFromPhpApi('news-item.php', { slug: args.whereEq.value });
    return [data]; // Returnera som array för kompatibilitet
  }
  
  // Hämta tutorial via postId
  if (args.collectionId === 'tutorials' && args.whereEq?.field === 'postId') {
    const data = await fetchFromPhpApi('tutorial.php', { postId: args.whereEq.value });
    return data ? [data] : []; // Returnera som array för kompatibilitet
  }
  
  // Hämta tutorial via id (__name__ == 'tutorials/{id}')
  if (args.collectionId === 'tutorials' && args.whereEq?.field === '__name__') {
    const value = args.whereEq.value;
    // Ta bort 'tutorials/' prefix om det finns
    const id = value.startsWith('tutorials/') ? value.substring(11) : value;
    const data = await fetchFromPhpApi('tutorial.php', { id });
    return data ? [data] : []; // Returnera som array för kompatibilitet
  }
  
  // Fallback: returnera tom array
  return [];
}

// Behåll dessa funktioner för kompatibilitet, men de används inte längre
// eftersom PHP returnerar redan normaliserade data
export function getDocId(row: any): string | undefined {
  if (row?.id) return row.id;
  const name: string | undefined = row?.document?.name;
  if (!name) return undefined;
  const parts = name.split('/');
  return parts[parts.length - 1];
}

export function mapPost(row: any): PostDoc | undefined {
  // PHP returnerar redan normaliserade data, så returnera direkt om det är PostDoc
  if (row && typeof row === 'object' && row.id && row.slug && row.title) {
    return row as PostDoc;
  }
  // Fallback för legacy-format (används ej längre)
  return undefined;
}

export function mapNews(row: any): NewsDoc | undefined {
  // PHP returnerar redan normaliserade data, så returnera direkt om det är NewsDoc
  if (row && typeof row === 'object' && row.id && row.slug && row.title) {
    return row as NewsDoc;
  }
  // Fallback för legacy-format (används ej längre)
  return undefined;
}

export function mapTutorial(row: any): TutorialDoc | undefined {
  // PHP returnerar redan normaliserade data, så returnera direkt om det är TutorialDoc
  if (row && typeof row === 'object' && row.id && row.postId && row.title) {
    return row as TutorialDoc;
  }
  // Fallback för legacy-format (används ej längre)
  return undefined;
}


