// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import Footer from './Footer';

describe('Footer featured listings', () => {
  it('shows the Product Hunt badge as a safe external link', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );

    const link = screen.getByRole('link', { name: 'MPStorys on Product Hunt' });
    expect(link.getAttribute('href')).toBe(
      'https://www.producthunt.com/products/mpstorys?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-mpstorys',
    );
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');

    const badge = screen.getByRole('img', {
      name: 'MPStorys - MapleStory tools, MapleStory guides, MapleStory calculator | Product Hunt',
    });
    expect(badge.getAttribute('src')).toBe(
      'https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1197969&theme=light&t=1784682160254',
    );
    expect(badge.getAttribute('width')).toBe('250');
    expect(badge.getAttribute('height')).toBe('54');
  });
});
