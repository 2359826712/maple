type GuideCardCopy = {
  title: string;
  classLabel: string;
  difficulty: string;
  length: string;
};

type GuideDetailCopy = {
  title: string;
  classLabel: string;
  difficulty: string;
  readTime: string;
  summary: string;
  toc: Array<{ id: string; title: string }>;
  sections: Array<{
    id: string;
    title: string;
    content: Array<{
      type: string;
      text?: string;
      variant?: string;
      items?: string[];
      style?: string;
      headers?: string[];
      rows?: string[][];
    }>;
  }>;
};

export const guideLocale = (language: string) => {
  if (language.startsWith('zh-Hant')) return 'zh-Hant';
  if (language.startsWith('zh')) return 'zh';
  if (language.startsWith('ja')) return 'ja';
  return 'en';
};

export const getGuideCardCopy = <T extends { title: string; class: string; difficulty: string; length: string }>(
  guide: T,
  _language: string,
): GuideCardCopy => ({
  title: guide.title,
  classLabel: guide.class,
  difficulty: guide.difficulty,
  length: guide.length,
});

export const getGuideDetailCopy = <T extends GuideDetailCopy>(guide: T, _language: string): T => guide;
