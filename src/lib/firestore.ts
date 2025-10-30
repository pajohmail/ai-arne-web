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

function getProjectId(): string {
  const pid = window.__APP_CONFIG__?.projectId?.trim();
  if (!pid) throw new Error('Saknar projectId i config.json');
  return pid;
}

function runQueryUrl() {
  const pid = getProjectId();
  return `https://firestore.googleapis.com/v1/projects/${pid}/databases/(default)/documents:runQuery`;
}

function valueFilter(fieldPath: string, value: string) {
  return {
    fieldFilter: {
      field: { fieldPath },
      op: 'EQUAL',
      value: { stringValue: value },
    },
  } as const;
}

export async function queryCollection(args: QueryArgs): Promise<any[]> {
  const structuredQuery: any = {
    from: [{ collectionId: args.collectionId }],
  };
  if (args.whereEq) {
    structuredQuery.where = valueFilter(args.whereEq.field, args.whereEq.value);
  }
  if (args.orderByCreatedAtDesc) {
    structuredQuery.orderBy = [
      { field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' },
    ];
  }
  if (typeof args.limit === 'number') structuredQuery.limit = args.limit;
  if (typeof args.offset === 'number' && args.offset > 0) structuredQuery.offset = args.offset;

  const body = { structuredQuery };
  const key = `rq:${JSON.stringify(body)}`;
  const url = runQueryUrl();
  return getJsonCached(key, async () => {
    const res = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      timeoutMs: 15000,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!Array.isArray(json)) return [];
    return json;
  });
}

// Firestore helper mappning
type FSValue =
  | { stringValue?: string }
  | { timestampValue?: string }
  | { integerValue?: string };

function getField(fields: Record<string, FSValue> | undefined, key: string): string | undefined {
  if (!fields) return undefined;
  const v = fields[key] as any;
  return v?.stringValue ?? v?.timestampValue ?? v?.integerValue ?? undefined;
}

export function getDocId(row: any): string | undefined {
  const name: string | undefined = row?.document?.name;
  if (!name) return undefined;
  const parts = name.split('/');
  return parts[parts.length - 1];
}

export function mapPost(row: any): PostDoc | undefined {
  const doc = row?.document;
  if (!doc) return undefined;
  const fields = doc.fields as Record<string, FSValue> | undefined;
  const id = getDocId(row);
  const slug = getField(fields, 'slug');
  const title = getField(fields, 'title');
  if (!id || !slug || !title) return undefined;
  return {
    id,
    slug,
    title,
    excerpt: getField(fields, 'excerpt'),
    content: getField(fields, 'content'),
    provider: getField(fields, 'provider'),
    sourceUrl: getField(fields, 'sourceUrl'),
    linkedinUrn: getField(fields, 'linkedinUrn'),
    createdAt: getField(fields, 'createdAt'),
    updatedAt: getField(fields, 'updatedAt'),
  };
}

export function mapNews(row: any): NewsDoc | undefined {
  const doc = row?.document;
  if (!doc) return undefined;
  const fields = doc.fields as Record<string, FSValue> | undefined;
  const id = getDocId(row);
  const slug = getField(fields, 'slug');
  const title = getField(fields, 'title');
  if (!id || !slug || !title) return undefined;
  return {
    id,
    slug,
    title,
    excerpt: getField(fields, 'excerpt'),
    content: getField(fields, 'content'),
    sourceUrl: getField(fields, 'sourceUrl'),
    source: getField(fields, 'source'),
    linkedinUrn: getField(fields, 'linkedinUrn'),
    createdAt: getField(fields, 'createdAt'),
    updatedAt: getField(fields, 'updatedAt'),
  };
}

export function mapTutorial(row: any): TutorialDoc | undefined {
  const doc = row?.document;
  if (!doc) return undefined;
  const fields = doc.fields as Record<string, FSValue> | undefined;
  const id = getDocId(row);
  const postId = getField(fields, 'postId');
  const title = getField(fields, 'title');
  if (!id || !postId || !title) return undefined;
  return {
    id,
    postId,
    title,
    content: getField(fields, 'content'),
    sourceUrl: getField(fields, 'sourceUrl'),
    createdAt: getField(fields, 'createdAt'),
    updatedAt: getField(fields, 'updatedAt'),
  };
}


