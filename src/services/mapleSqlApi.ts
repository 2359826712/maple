import { getAccessToken } from '@/hooks/useAuthSession';
import { telemetry } from './telemetry';

const rawApiBaseUrl = (import.meta.env.VITE_MAPLE_SQL_API_BASE_URL || '/api').trim();
const apiBaseUrl = rawApiBaseUrl.replace(/\/+$/, '');
const defaultTenantKey = (import.meta.env.VITE_MAPLE_SQL_TENANT_KEY || 'default').trim() || 'default';

export class MapleApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = 'MapleApiError';
    this.status = status;
    this.payload = payload;
  }
}

type RequestOptions = {
  method?: string;
  headers?: Headers | Record<string, string>;
  body?: unknown;
  auth?: boolean;
  [key: string]: unknown;
};

const buildUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${apiBaseUrl}${normalizedPath}`;
};

const parseResponseBody = async (response: Response) => {
  if (response.status === 204) return null;

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  return text || null;
};

const normalizeErrorMessage = (payload: unknown, fallback: string) => {
  if (typeof payload === 'string' && payload.trim()) return payload.trim();
  if (payload && typeof payload === 'object') {
    const entries = payload as Record<string, unknown>;
    const message = entries.message || entries.error || entries.detail;
    if (typeof message === 'string' && message.trim()) return message.trim();
  }
  return fallback;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, auth = false, ...rest } = options;
  const token = auth ? getAccessToken() : null;
  const requestHeaders = new Headers(headers);

  if (body !== undefined && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }
  if (auth && token) {
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path), {
      credentials: 'include',
      ...(rest as Record<string, unknown>),
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    telemetry.trackApiFailure(path, 0);
    throw error;
  }

  const payload = await parseResponseBody(response);
  if (!response.ok) {
    telemetry.trackApiFailure(path, response.status);
    throw new MapleApiError(
      normalizeErrorMessage(payload, `Request failed with status ${response.status}`),
      response.status,
      payload,
    );
  }

  return payload as T;
}

export type AuthUser = {
  id: string;
  email: string;
  username: string;
  display_name: string;
  avatar_url: string;
  status: string;
};

export type AuthResponse = {
  access_token: string;
  access_expires_at: string;
  auto_login_expires_at?: string;
  user: AuthUser;
  tenant_id: string;
};

export type NewsletterSubscribeInput = {
  email: string;
  first_name?: string;
  ign?: string;
  world?: string;
  locale?: string;
  tenant_key?: string;
};

export type MapleNotification = {
  id: string;
  tenant_id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  link: string;
  read_at?: string | null;
  created_at: string;
};

export type CommunityProposal = {
  id: string;
  tenant_id: string;
  class_name: string;
  action: string;
  kind: string;
  title: string;
  note: string;
  status: string;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  votes: number;
  comment_count: number;
  previous_images: string[];
  proposed_images: string[];
};

export type CommunityProposalComment = {
  id: string;
  proposal_id: string;
  user_id?: string | null;
  content: string;
  created_at: string;
};

export type CommunityProposalInput = {
  class_name: string;
  action: string;
  kind: string;
  title: string;
  note: string;
  status?: string;
  previous_images?: string[];
  proposed_images?: string[];
};

export type GuideCommentRecord = {
  id: string;
  tenant_id: string;
  guide_id: string;
  user_id?: string | null;
  parent_id?: string | null;
  content: string;
  upvotes: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
};

export type WikiMirrorPageRecord = {
  id: string;
  source_key: 'mswiki' | 'fandom';
  source_page_id: number;
  namespace: number;
  title: string;
  slug: string;
  category: string;
  source_url: string;
  extract: string;
  content_text?: string;
  content_html?: string;
  word_count: number;
  revision_id?: number | null;
  touched_at?: string | null;
  tags: string[];
  asset_urls?: string[];
  template_titles?: string[];
  created_at: string;
  updated_at: string;
};

export type WikiMirrorSyncState = {
  source_key: string;
  namespace: number;
  continue_token: string;
  status: string;
  message: string;
  processed_pages: number;
  started_at?: string | null;
  finished_at?: string | null;
  updated_at: string;
};

export type RealtimeContentRecord<TPayload = Record<string, unknown>> = {
  key: string;
  source: string;
  source_url: string;
  content_type: string;
  payload: TPayload;
  content_text: string;
  content_html: string;
  synced_at: string;
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type CharacterProfile = {
  id: string;
  user_id: string;
  name: string;
  class_name: string;
  level: number;
  server: string;
  world: string;
  is_default: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type CharacterInput = {
  name: string;
  class_name: string;
  level: number;
  server: string;
  world: string;
};

export type BossChecklistEntry = {
  boss_id: string;
  difficulty: string;
  completed_count: number;
  updated_at: string;
};

export const mapleSqlApi = {
  config: {
    apiBaseUrl,
    tenantKey: defaultTenantKey,
  },

  auth: {
    login: (payload: { email: string; password: string; auto_login: boolean }) =>
      request<AuthResponse>('/auth/login', { method: 'POST', body: payload }),
    signup: (payload: { email: string; username: string; display_name: string; password: string; auto_login: boolean }) =>
      request<AuthResponse>('/auth/signup', { method: 'POST', body: payload }),
    refresh: () => request<AuthResponse>('/auth/refresh', { method: 'POST' }),
    logout: () => request<void>('/auth/logout', { method: 'POST' }),
    me: () => request<{ user_id: string; tenant_id: string }>('/me', { auth: true }),
  },
  accountData: {
    get: () => request<{ data: Record<string, string>; revision: number; updated_at?: string }>('/player-data', { auth: true }),
    save: (data: Record<string, string>) =>
      request<{ data: Record<string, string>; revision: number; updated_at: string }>('/player-data', {
        method: 'PUT',
        auth: true,
        body: { data },
      }),
  },
  newsletter: {
    subscribe: (payload: NewsletterSubscribeInput) =>
      request<{ ok?: boolean; message?: string }>('/newsletter/subscribe', {
        method: 'POST',
        body: {
          tenant_key: payload.tenant_key || defaultTenantKey,
          locale: payload.locale || 'en',
          ...payload,
        },
      }),
    unsubscribe: (email: string) =>
      request<{ ok: true }>('/newsletter/unsubscribe', {
        method: 'POST',
        body: { email },
      }),
  },

  wikiMirror: {
    listPages: (params: { q?: string; category?: string; source?: string; namespace?: number | 'all'; limit?: number; offset?: number } = {}) => {
      const query = new URLSearchParams();
      if (params.q) query.set('q', params.q);
      if (params.category) query.set('category', params.category);
      if (params.source) query.set('source', params.source);
      if (params.namespace !== undefined) query.set('namespace', String(params.namespace));
      if (params.limit) query.set('limit', String(params.limit));
      if (params.offset) query.set('offset', String(params.offset));
      const suffix = query.toString() ? `?${query}` : '';
      return request<WikiMirrorPageRecord[]>(`/wiki/mirror/pages${suffix}`);
    },
    getPage: (sourceKey: string, sourcePageId: number) =>
      request<WikiMirrorPageRecord>(`/wiki/mirror/pages/${encodeURIComponent(sourceKey)}/${sourcePageId}`),
    getPageByTitle: (title: string, source = 'mswiki') => {
      const query = new URLSearchParams();
      query.set('title', title);
      if (source) query.set('source', source);
      return request<WikiMirrorPageRecord>(`/wiki/mirror/pages/by-title?${query}`);
    },
    listSyncStates: () => request<WikiMirrorSyncState[]>('/wiki/mirror/sync'),
    startSync: (params: { source?: string; maxPages?: number } = {}) => {
      const query = new URLSearchParams();
      if (params.source) query.set('source', params.source);
      if (params.maxPages !== undefined) query.set('max_pages', String(params.maxPages));
      const suffix = query.toString() ? `?${query}` : '';
      return request<{ ok: boolean; source: string; max_pages: number }>(`/wiki/mirror/sync${suffix}`, { method: 'POST' });
    },
  },

  realtimeContent: {
    get: <TPayload = Record<string, unknown>>(key: string) =>
      request<RealtimeContentRecord<TPayload>>(`/realtime/content?key=${encodeURIComponent(key)}`),
    upsert: <TPayload = Record<string, unknown>>(payload: {
      key: string;
      source: string;
      source_url: string;
      content_type: string;
      payload: TPayload;
      content_text?: string;
      content_html?: string;
      expires_at?: string | null;
    }) => request<RealtimeContentRecord<TPayload>>('/realtime/content', {
      method: 'POST',
      auth: true,
      body: {
        content_text: '',
        content_html: '',
        ...payload,
      },
    }),
  },

  notifications: {
    list: (unreadOnly = false) =>
      request<MapleNotification[]>(`/notifications${unreadOnly ? '?unread=1' : ''}`, { auth: true }),
    markRead: (id: string) =>
      request<{ ok: true }>(`/notifications/${id}/read`, { method: 'POST', auth: true }),
    markAllRead: () =>
      request<{ ok: true }>('/notifications/mark_all_read', { method: 'POST', auth: true }),
  },

  community: {
    listProposals: (params: { status?: string; className?: string; kind?: string; sort?: string } = {}) => {
      const query = new URLSearchParams();
      if (params.status) query.set('status', params.status);
      if (params.className) query.set('class', params.className);
      if (params.kind) query.set('kind', params.kind);
      if (params.sort) query.set('sort', params.sort);
      const suffix = query.toString() ? `?${query}` : '';
      return request<CommunityProposal[]>(`/community/proposals${suffix}`, { auth: true });
    },
    createProposal: (payload: CommunityProposalInput) =>
      request<CommunityProposal>('/community/proposals', {
        method: 'POST',
        auth: true,
        body: payload,
      }),
    voteProposal: (proposalId: string, vote: -1 | 0 | 1) =>
      request<{ votes: number }>(`/community/proposals/${proposalId}/vote`, {
        method: 'POST',
        auth: true,
        body: { vote },
      }),
    listProposalComments: (proposalId: string) =>
      request<CommunityProposalComment[]>(`/community/proposals/${proposalId}/comments`, { auth: true }),
    addProposalComment: (proposalId: string, content: string) =>
      request<CommunityProposalComment>(`/community/proposals/${proposalId}/comments`, {
        method: 'POST',
        auth: true,
        body: { content },
      }),
  },

  guides: {
    listBookmarks: () => request<{ guide_ids: string[] }>('/guides/bookmarks', { auth: true }),
    listLikes: () => request<{ guide_ids: string[] }>('/guides/likes', { auth: true }),
    getBookmark: (guideId: string) => request<{ active: boolean }>(`/guides/${guideId}/bookmark`, { auth: true }),
    setBookmark: (guideId: string, active: boolean) =>
      request<{ active: boolean }>(`/guides/${guideId}/bookmark`, {
        method: 'POST',
        auth: true,
        body: { active },
      }),
    getLike: (guideId: string) => request<{ active: boolean }>(`/guides/${guideId}/like`, { auth: true }),
    setLike: (guideId: string, active: boolean) =>
      request<{ active: boolean }>(`/guides/${guideId}/like`, {
        method: 'POST',
        auth: true,
        body: { active },
      }),
    getLikeCount: (guideId: string) => request<{ count: number }>(`/guides/${guideId}/like/count`, { auth: true }),
    listComments: (guideId: string) =>
      request<GuideCommentRecord[]>(`/guides/${guideId}/comments`, { auth: true }),
    addComment: (guideId: string, content: string, parentId?: string) =>
      request<GuideCommentRecord>(`/guides/${guideId}/comments`, {
        method: 'POST',
        auth: true,
        body: parentId ? { content, parent_id: parentId } : { content },
      }),
    voteComment: (commentId: string, vote: -1 | 0 | 1) =>
      request<{ upvotes: number }>(`/guides/comments/${commentId}/vote`, {
        method: 'POST',
        auth: true,
        body: { vote },
      }),
  },

  characters: {
    list: () => request<CharacterProfile[]>('/characters', { auth: true }),
    create: (input: CharacterInput) =>
      request<CharacterProfile>('/characters', { method: 'POST', auth: true, body: input }),
    update: (id: string, input: CharacterInput) =>
      request<CharacterProfile>(`/characters/${id}`, { method: 'PUT', auth: true, body: input }),
    delete: (id: string) =>
      request<void>(`/characters/${id}`, { method: 'DELETE', auth: true }),
    getChecklist: (charId: string) =>
      request<BossChecklistEntry[]>(`/characters/${charId}/checklist`, { auth: true }),
    updateChecklist: (charId: string, entries: BossChecklistEntry[]) =>
      request<{ ok: boolean }>(`/characters/${charId}/checklist`, {
        method: 'PUT',
        auth: true,
        body: { entries },
      }),
  },
};
