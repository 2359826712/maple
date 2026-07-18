import generatedContent from '../../generated/content.json';
import generatedSources from '../../generated/sources.json';
import unifiedSearch from '../../generated/search.json';
import type { ContentSource, IndexedContentRecord } from './contentIndexTypes';

export type { ContentSource, IndexedContentRecord } from './contentIndexTypes';

export const indexedContent = generatedContent as IndexedContentRecord[];
export const indexedContentSources = generatedSources as ContentSource[];
export const unifiedContentSearch = unifiedSearch as Array<Record<string, unknown>>;
