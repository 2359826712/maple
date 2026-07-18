import { buildResourceIndex } from './build-index.mjs';

const indexes = await buildResourceIndex();
console.log(`Built unified search data with ${indexes.search.length} record(s).`);
