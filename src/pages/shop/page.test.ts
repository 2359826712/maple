import { describe, expect, it } from 'vitest';
import { shopProducts } from './products';

describe('shop links', () => {
  it('exposes the requested MMOEXP destinations over HTTPS', () => {
    expect(shopProducts.map((product) => product.href)).toEqual([
      'https://www.mmoexp.com/Maplestory-m/Mesos.html',
      'https://www.mmoexp.com/Maplestory-m/Crystal.html',
      'https://www.mmoexp.com/Maplestory-m/Items.html',
      'https://www.mmoexp.com/Maplestory-n/Neso.html',
      'https://www.mmoexp.com/Maplestory-worlds/Mesos.html',
      'https://www.mmoexp.com/Maplestory-worlds/Account.html',
      'https://www.mmoexp.com/Artale/Mesos.html',
    ]);
  });
});
