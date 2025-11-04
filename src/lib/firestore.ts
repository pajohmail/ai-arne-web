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
  
  // Debug: Logga params och URL
  if (import.meta.env.DEV && endpoint === 'tutorial.php') {
    console.log('fetchFromPhpApi - params:', params, 'url:', url);
    if (params.id) {
      console.log('fetchFromPhpApi - id param:', params.id, 'type:', typeof params.id, 'length:', String(params.id).length);
    }
  }
  
  return getJsonCached(key, async () => {
    try {
      console.log('[Firestore] Fetching:', url);
      const res = await fetchWithTimeout(url, {
        method: 'GET',
        timeoutMs: 15000,
      });
      
      console.log('[Firestore] Response status:', res.status, res.statusText);
      
      if (!res.ok) {
        let errorText = '';
        try {
          const error = await res.json();
          errorText = error.error || `HTTP ${res.status}`;
          console.error('[Firestore] API error:', error);
        } catch {
          errorText = `HTTP ${res.status}`;
          const text = await res.text();
          console.error('[Firestore] Response text:', text.substring(0, 200));
        }
        throw new Error(errorText);
      }
      
      const text = await res.text();
      console.log('[Firestore] Response text (first 200 chars):', text.substring(0, 200));
      
      let json;
      try {
        json = JSON.parse(text);
      } catch (parseError) {
        console.error('[Firestore] JSON parse error:', parseError);
        console.error('[Firestore] Full response:', text);
        throw new Error('Ogiltigt JSON-svar från API');
      }
      
      if (!json.success) {
        console.error('[Firestore] API returned success=false:', json);
        throw new Error(json.error || 'Okänt fel från API');
      }
      
      console.log('[Firestore] Success:', json.data?.length || 'single item');
      return json.data;
    } catch (error) {
      console.error('[Firestore] Fetch error:', error);
      throw error;
    }
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
    let id: string;
    const prefix = 'tutorials/';
    if (value.startsWith(prefix)) {
      id = value.substring(prefix.length);
    } else {
      id = value;
    }
    
    // Validera att ID:t inte är tomt
    if (!id || id.length === 0) {
      console.error('[Firestore] Empty ID extracted from value:', value);
      return [];
    }
    
    if (import.meta.env.DEV) {
      console.log('[Firestore] queryCollection - value:', value, 'extracted id:', id, 'id length:', id.length);
    }
    
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


