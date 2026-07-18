import { buildResourceIndex } from './build-index.mjs';

const indexes = await buildResourceIndex();
console.log(`Generated MPStorys site data for ${indexes.resources.length} indexed resource(s).`);
