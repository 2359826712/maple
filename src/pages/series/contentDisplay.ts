import type { IndexedContentRecord } from '@/domain/contentIndex';

export const getIndexedContentDisplayTitle = (
  content: Pick<IndexedContentRecord, 'title' | 'original_title' | 'summary'>,
) => {
  const original = content.original_title.replace(/\s*\|\s*NiaMeowDB\s*$/i, '').trim();
  const scrapedChrome = content.title.length > 180
    || Boolean(content.summary && content.title.includes(content.summary.slice(0, 80)));
  return scrapedChrome && original ? original : content.title;
};
