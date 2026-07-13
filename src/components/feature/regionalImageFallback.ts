import { getNewsFallbackImage } from '@/services/liveContent';

export function applyRegionalImageFallback(image: HTMLImageElement, version: string) {
  if (image.dataset.fallbackApplied === 'true') {
    image.style.display = 'none';
    return;
  }

  image.dataset.fallbackApplied = 'true';
  image.src = getNewsFallbackImage(version);
}
