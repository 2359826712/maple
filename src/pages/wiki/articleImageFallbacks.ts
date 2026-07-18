export interface WikiArticleFallbackImage {
  src: string;
  alt?: string;
}

interface WikiArticleFallbackConfig {
  minimumSourceImages: number;
  images: WikiArticleFallbackImage[];
}

const wikiImage = (filename: string, alt?: string): WikiArticleFallbackImage => ({
  src: `/static/images/wiki/${filename}`,
  alt,
});

const bossImage = (filename: string): WikiArticleFallbackImage => ({
  src: `/static/images/vendor/static.wikia.nocookie.net/${filename}`,
});

const bossImages: Record<string, WikiArticleFallbackImage> = {
  'black mage': bossImage('latest-bc5628e4fe.webp'),
  damien: bossImage('latest-24e2ef73f7.webp'),
  gloom: bossImage('latest-277e90d6a8.webp'),
  'guardian angel slime': bossImage('latest-36166e0c8e.webp'),
  lotus: bossImage('latest-12b9faa695.webp'),
  lucid: bossImage('latest-4e9cdee0aa.webp'),
  magnus: bossImage('latest-783b738112.webp'),
  will: bossImage('latest-3be9b71f09.webp'),
};

const classButtonImages: WikiArticleFallbackImage[] = [
  'classbutton_adele-b7edc5cf16.png',
  'classbutton_aran-a45a53a94a.png',
  'classbutton_kanna-2e165a7751.png',
].map((filename) => ({
  src: `/static/images/vendor/media.maplestorywiki.net/${filename}`,
}));

const worldMapImages: WikiArticleFallbackImage[] = [
  {
    src: '/static/images/vendor/d3uzjcc4cyf4cj.cloudfront.net/maple_world_select-8888b64182.webp',
    alt: 'Maple World',
  },
  {
    src: '/static/images/vendor/d3uzjcc4cyf4cj.cloudfront.net/arcane_river_select-897e7f69e5.webp',
    alt: 'Arcane River',
  },
  {
    src: '/static/images/vendor/d3uzjcc4cyf4cj.cloudfront.net/grandis_select-53a0364877.webp',
    alt: 'Grandis',
  },
];

const fallbackConfigs: Record<string, WikiArticleFallbackConfig> = {
  'link skill': {
    minimumSourceImages: 1,
    images: [wikiImage('link-skill.png')],
  },
  'legion system': {
    minimumSourceImages: 1,
    images: classButtonImages,
  },
  'arcane river': {
    minimumSourceImages: 1,
    images: [worldMapImages[1]],
  },
  grandis: {
    minimumSourceImages: 1,
    images: [worldMapImages[2]],
  },
  bosses: {
    minimumSourceImages: 3,
    images: Object.values(bossImages),
  },
  'star force': {
    minimumSourceImages: 1,
    images: [wikiImage('star-force.png')],
  },
  potential: {
    minimumSourceImages: 1,
    images: [wikiImage('potential-item.png'), wikiImage('potential-rank.png')],
  },
  'hexa matrix': {
    minimumSourceImages: 1,
    images: [wikiImage('hexa-skills.png'), wikiImage('hexa-stats.png')],
  },
  equipment: {
    minimumSourceImages: 1,
    images: [wikiImage('potential-item.png')],
  },
  locations: {
    minimumSourceImages: 1,
    images: worldMapImages,
  },
  'maple world': {
    minimumSourceImages: 1,
    images: worldMapImages,
  },
};

Object.entries(bossImages).forEach(([title, image]) => {
  fallbackConfigs[title] = {
    minimumSourceImages: 1,
    images: [image],
  };
});

export function getWikiArticleImageFallbacks(
  sourceTitle: string,
  sourceImageCount: number,
): WikiArticleFallbackImage[] {
  const normalizedTitle = sourceTitle.replace(/_/g, ' ').trim().toLowerCase();
  const config = fallbackConfigs[normalizedTitle];
  if (!config || sourceImageCount >= config.minimumSourceImages) return [];
  return config.images;
}
