import type { StaticContentLanguage } from './staticTranslation';

const googleLanguageCodes: Record<StaticContentLanguage, string> = {
  en: 'en',
  zh: 'zh-CN',
  'zh-Hant': 'zh-TW',
  ja: 'ja',
  ko: 'ko',
};

const libreLanguageCodes: Record<StaticContentLanguage, string> = {
  en: 'en',
  zh: 'zh-Hans',
  'zh-Hant': 'zh-Hant',
  ja: 'ja',
  ko: 'ko',
};

const selfHostedLibreLanguageCodes: Record<StaticContentLanguage, string> = {
  en: 'en',
  zh: 'zh',
  'zh-Hant': 'zh',
  ja: 'ja',
  ko: 'ko',
};

const publicLibreTranslateUrl = 'https://translate.fedilab.app/translate';

const configuredLibreTranslateUrl = () => (
  typeof process !== 'undefined' ? process.env.LIBRETRANSLATE_API_URL?.trim() || '' : ''
);

const maxGooglePartLength = 3_800;
const maxConcurrentRequests = 6;
let activeRequests = 0;
const requestQueue: Array<() => void> = [];

const withRequestSlot = async <T,>(request: () => Promise<T>) => {
  if (activeRequests >= maxConcurrentRequests) {
    await new Promise<void>((resolve) => requestQueue.push(resolve));
  }
  activeRequests += 1;
  try {
    return await request();
  } finally {
    activeRequests -= 1;
    requestQueue.shift()?.();
  }
};

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const translateWithLibre = async (
  texts: string[],
  targetLanguage: StaticContentLanguage,
  sourceLanguage?: StaticContentLanguage,
  endpoint = publicLibreTranslateUrl,
) => {
  const languageCodes = endpoint === publicLibreTranslateUrl
    ? libreLanguageCodes
    : selfHostedLibreLanguageCodes;
  const response = await withRequestSlot(() => fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q: texts,
      source: sourceLanguage ? languageCodes[sourceLanguage] : 'auto',
      target: languageCodes[targetLanguage],
      format: 'text',
    }),
    signal: AbortSignal.timeout(12_000),
  }));
  if (!response.ok) throw new Error(`LibreTranslate failed with ${response.status}`);
  const payload = await response.json() as { translatedText?: string | string[] };
  const translated = Array.isArray(payload.translatedText)
    ? payload.translatedText
    : typeof payload.translatedText === 'string' && texts.length === 1
      ? [payload.translatedText]
      : [];
  if (translated.length !== texts.length || translated.some((value) => typeof value !== 'string')) {
    throw new Error('LibreTranslate returned an invalid response');
  }
  return translated;
};

const translateTextsWithLibre = async (
  texts: string[],
  targetLanguage: StaticContentLanguage,
  sourceLanguage?: StaticContentLanguage,
  endpoint = publicLibreTranslateUrl,
) => {
  const jobs = texts.flatMap((text, textIndex) => splitText(text).map((part, partIndex) => ({
    part,
    partIndex,
    textIndex,
  })));
  const translatedParts: string[][] = texts.map(() => []);
  const groups: typeof jobs[] = [];
  let currentGroup: typeof jobs = [];
  let currentLength = 0;
  jobs.forEach((job) => {
    if (currentGroup.length >= 20 || (currentGroup.length > 0 && currentLength + job.part.length > 18_000)) {
      groups.push(currentGroup);
      currentGroup = [];
      currentLength = 0;
    }
    currentGroup.push(job);
    currentLength += job.part.length;
  });
  if (currentGroup.length > 0) groups.push(currentGroup);

  await Promise.all(groups.map(async (group) => {
    let translated: string[] | undefined;
    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        translated = await translateWithLibre(group.map((job) => job.part), targetLanguage, sourceLanguage, endpoint);
        break;
      } catch (error) {
        lastError = error;
        await wait(350 * (attempt + 1));
      }
    }
    if (!translated) throw lastError || new Error('LibreTranslate unavailable');
    group.forEach((job, index) => {
      translatedParts[job.textIndex][job.partIndex] = translated[index] || job.part;
    });
  }));
  return translatedParts.map((parts, index) => parts.join('') || texts[index]);
};

const splitText = (text: string) => {
  if (text.length <= maxGooglePartLength) return [text];
  const parts: string[] = [];
  let remaining = text;
  while (remaining.length > maxGooglePartLength) {
    const window = remaining.slice(0, maxGooglePartLength);
    const naturalBreak = Math.max(
      window.lastIndexOf('\n'),
      window.lastIndexOf('. '),
      window.lastIndexOf('! '),
      window.lastIndexOf('? '),
      window.lastIndexOf('。'),
      window.lastIndexOf('！'),
      window.lastIndexOf('？'),
      window.lastIndexOf(' '),
    );
    const end = naturalBreak >= Math.floor(maxGooglePartLength * 0.55)
      ? naturalBreak + 1
      : maxGooglePartLength;
    parts.push(remaining.slice(0, end));
    remaining = remaining.slice(end);
  }
  if (remaining) parts.push(remaining);
  return parts;
};

const requestTranslation = async (
  text: string,
  targetLanguage: StaticContentLanguage,
  sourceLanguage?: StaticContentLanguage,
) => {
  if (!text.trim()) return text;
  const leading = text.match(/^\s*/)?.[0] || '';
  const trailing = text.match(/\s*$/)?.[0] || '';
  const body = new URLSearchParams({
    client: 'gtx',
    sl: sourceLanguage ? googleLanguageCodes[sourceLanguage] : 'auto',
    tl: googleLanguageCodes[targetLanguage],
    dt: 't',
    q: text.trim(),
  });
  let response: Response | undefined;
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      response = await withRequestSlot(() => fetch('https://translate.googleapis.com/translate_a/single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: body.toString(),
        signal: AbortSignal.timeout(12_000),
      }));
      if (response.ok) break;
      lastError = new Error(`Translation fallback failed with ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await wait(300 * (attempt + 1));
  }
  if (!response?.ok) throw lastError || new Error('Translation fallback unavailable');
  const payload = await response.json() as unknown;
  if (!Array.isArray(payload) || !Array.isArray(payload[0])) {
    throw new Error('Translation fallback returned an invalid response');
  }
  const translated = (payload[0] as unknown[])
    .map((segment) => Array.isArray(segment) && typeof segment[0] === 'string' ? segment[0] : '')
    .join('');
  if (!translated.trim()) throw new Error('Translation fallback returned no text');
  return `${leading}${translated}${trailing}`;
};

const translateTextsWithGoogleTransport = async (
  texts: string[],
  targetLanguage: StaticContentLanguage,
  sourceLanguage?: StaticContentLanguage,
) => {
  const jobs = texts.flatMap((text, textIndex) => splitText(text).map((part, partIndex) => ({
    part,
    partIndex,
    textIndex,
  })));
  const translatedParts: string[][] = texts.map(() => []);
  const groups: typeof jobs[] = [];
  let currentGroup: typeof jobs = [];
  let currentLength = 0;
  jobs.forEach((job) => {
    const nextLength = currentLength + job.part.length + 32;
    if (currentGroup.length > 0 && nextLength > maxGooglePartLength) {
      groups.push(currentGroup);
      currentGroup = [];
      currentLength = 0;
    }
    currentGroup.push(job);
    currentLength += job.part.length + 32;
  });
  if (currentGroup.length > 0) groups.push(currentGroup);

  await Promise.all(groups.map(async (group) => {
    const combined = group
      .map((job, index) => `${index > 0 ? `\n[[MPSTORYS_${index}]]\n` : ''}${job.part.trim()}`)
      .join('');
    const translated = await requestTranslation(combined, targetLanguage, sourceLanguage);
    const values = translated.split(/\s*\[\[MPSTORYS_\d+\]\]\s*/g);
    if (values.length !== group.length) {
      await Promise.all(group.map(async (job) => {
        translatedParts[job.textIndex][job.partIndex] = await requestTranslation(
          job.part,
          targetLanguage,
          sourceLanguage,
        );
      }));
      return;
    }
    group.forEach((job, index) => {
      const leading = job.part.match(/^\s*/)?.[0] || '';
      const trailing = job.part.match(/\s*$/)?.[0] || '';
      translatedParts[job.textIndex][job.partIndex] = `${leading}${values[index].trim()}${trailing}`;
    });
  }));
  return translatedParts.map((parts, index) => parts.join('') || texts[index]);
};

export async function translateTextsWithGoogle(
  texts: string[],
  targetLanguage: StaticContentLanguage,
  sourceLanguage?: StaticContentLanguage,
) {
  if (targetLanguage === sourceLanguage) return [...texts];
  try {
    return await translateTextsWithGoogleTransport(texts, targetLanguage, sourceLanguage);
  } catch {
    // Continue through LibreTranslate when the fast provider is rate limited.
  }
  const configuredEndpoint = configuredLibreTranslateUrl();
  if (configuredEndpoint) {
    try {
      return await translateTextsWithLibre(texts, targetLanguage, sourceLanguage, configuredEndpoint);
    } catch {
      // Continue through the public mirror while the private service is starting.
    }
  }
  return translateTextsWithLibre(texts, targetLanguage, sourceLanguage, publicLibreTranslateUrl);
}
