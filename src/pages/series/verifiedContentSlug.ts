type SluggableResource = {
  title: string;
  resourceId?: string;
  contentId?: string;
  [key: string]: unknown;
};

export const getVerifiedSeriesResourceSlug = (resource: SluggableResource) => {
  const titleSlug = resource.title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, resource.resourceId || resource.contentId ? 56 : 96);
  const recordId = resource.contentId || resource.resourceId;
  return recordId ? `${titleSlug}-${recordId}`.slice(0, 120) : titleSlug;
};
