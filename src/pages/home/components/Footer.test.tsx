// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Footer from './Footer';

describe('Footer featured listings', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('continuously scrolls the listings in a seamless loop', () => {
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(500);

    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );

    const listings = screen.getByLabelText('Featured listings');
    const firstClone = listings.querySelector<HTMLElement>('[data-marquee-clone="true"]');

    expect(listings.getAttribute('data-auto-scroll')).toBe('true');
    expect(listings.getAttribute('data-marquee-ready')).toBe('true');
    expect(listings.querySelectorAll('[data-marquee-clone="true"]')).not.toHaveLength(0);
    expect(firstClone?.getAttribute('aria-hidden')).toBe('true');
    expect(listings.style.getPropertyValue('--featured-listings-distance')).toBe('250px');
    expect(listings.style.getPropertyValue('--featured-listings-duration')).toBe(`${250 / 45}s`);
  });

  it('shows all featured listing links in the bottom scrolling row', () => {
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

    const listings = screen.getByLabelText('Featured listings');
    expect(listings.className).toContain('overflow-hidden');
    expect(listings.className).toContain('flex-nowrap');
    expect(listings.className).toContain('featured-listings-marquee');
    expect(screen.queryByRole('link', { name: 'MPStorys on Good AI Tools' })).toBeNull();
    expect(screen.queryByRole('img', { name: 'Good AI Tools' })).toBeNull();

    const aibesttopBadge = screen.getByRole('link', { name: 'MPStorys on AIBestTop' });
    expect(aibesttopBadge.getAttribute('href')).toBe('https://aibesttop.com');
    expect(aibesttopBadge.getAttribute('target')).toBe('_blank');
    expect(aibesttopBadge.getAttribute('rel')).toBe('noopener noreferrer');
    expect(aibesttopBadge.textContent).toBe('footer_listed_aibesttop');
    expect(
      screen.getAllByRole('link').filter((item) => item.getAttribute('href') === 'https://aibesttop.com'),
    ).toHaveLength(1);

    const openHuntsLink = screen.getByRole('link', { name: 'MPStorys on OpenHunts' });
    expect(openHuntsLink.getAttribute('href')).toBe('https://openhunts.com');
    expect(openHuntsLink.getAttribute('target')).toBe('_blank');
    expect(openHuntsLink.getAttribute('rel')).toBe('noopener noreferrer');
    expect(openHuntsLink.getAttribute('title')).toBe('OpenHunts Club');

    const openHuntsBadge = screen.getByRole('img', { name: 'OpenHunts Club Member' });
    expect(openHuntsBadge.getAttribute('src')).toBe('https://cdn.openhunts.com/badges/club.webp');
    expect(openHuntsBadge.getAttribute('width')).toBe('111');
    expect(openHuntsBadge.getAttribute('height')).toBe('24');

    const aidirsLink = screen.getByRole('link', { name: 'MPStorys on Aidirs' });
    expect(aidirsLink.getAttribute('href')).toBe('https://aidirs.best/item/mp-storys');
    expect(aidirsLink.getAttribute('target')).toBe('_blank');
    expect(aidirsLink.getAttribute('rel')).toBe('noopener noreferrer');

    const aidirsBadge = screen.getByRole('img', {
      name: 'MPStorys - MapleStory news and guide hub | Aidirs',
    });
    expect(aidirsBadge.getAttribute('src')).toBe('https://aidirs.best/light.svg');
    expect(aidirsBadge.getAttribute('width')).toBe('86');
    expect(aidirsBadge.getAttribute('height')).toBe('24');

    const aiAgentsDirectoryLink = screen.getByRole('link', {
      name: 'MPStorys on AI Agents Directory',
    });
    expect(aiAgentsDirectoryLink.getAttribute('href')).toBe(
      'https://aiagentsdirectory.com',
    );
    expect(aiAgentsDirectoryLink.getAttribute('target')).toBe('_blank');
    expect(aiAgentsDirectoryLink.getAttribute('rel')).toBe('noopener noreferrer');
    expect(aiAgentsDirectoryLink.getAttribute('title')).toBe(
      'Discover AI Agents Directory',
    );

    const aiAgentsDirectoryBadge = screen.getByRole('img', {
      name: 'Featured on AI Agents Directory',
    });
    expect(aiAgentsDirectoryBadge.getAttribute('src')).toBe(
      'https://aiagentsdirectory.com/featured-badge.svg?v=2024',
    );
    expect(aiAgentsDirectoryBadge.getAttribute('width')).toBe('96');
    expect(aiAgentsDirectoryBadge.getAttribute('height')).toBe('24');

    const badge = screen.getByRole('img', {
      name: 'MPStorys - MapleStory tools, MapleStory guides, MapleStory calculator | Product Hunt',
    });
    expect(badge.getAttribute('src')).toBe(
      'https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1197969&theme=light&t=1784682160254',
    );
    expect(badge.getAttribute('width')).toBe('111');
    expect(badge.getAttribute('height')).toBe('24');

    const aiToolFameLink = screen.getByRole('link', { name: 'MPStorys on AI Tool Fame' });
    expect(aiToolFameLink.getAttribute('href')).toBe('https://aitoolfame.com/item/mpstorys');
    expect(aiToolFameLink.getAttribute('target')).toBe('_blank');
    expect(aiToolFameLink.getAttribute('rel')).toBe('noopener noreferrer');

    const aiToolFameBadge = screen.getByRole('img', { name: 'Featured on aitoolfame.com' });
    expect(aiToolFameBadge.getAttribute('src')).toBe('https://aitoolfame.com/badge-light.svg');
    expect(aiToolFameBadge.getAttribute('width')).toBe('84');
    expect(aiToolFameBadge.getAttribute('height')).toBe('24');

    const artificinLink = screen.getByRole('link', { name: 'MPStorys featured on Artificin' });
    expect(artificinLink.getAttribute('href')).toBe(
      'https://artificin.com?utm_source=badge&utm_medium=referral&utm_campaign=featured_badge',
    );
    expect(artificinLink.getAttribute('target')).toBe('_blank');
    expect(artificinLink.getAttribute('rel')).toBe('noopener noreferrer');

    const artificinBadge = screen.getByRole('img', { name: 'Featured on Artificin' });
    expect(artificinBadge.getAttribute('src')).toBe(
      'https://artificin.com/badges/Artificin-badge.png',
    );
    expect(artificinBadge.getAttribute('width')).toBe('84');
    expect(artificinBadge.getAttribute('height')).toBe('24');

    const bestskyToolsLink = screen.getByRole('link', {
      name: 'MPStorys featured on BestskyTools',
    });
    expect(bestskyToolsLink.getAttribute('href')).toBe(
      'https://bestsky.tools?utm_source=badge',
    );
    expect(bestskyToolsLink.getAttribute('target')).toBe('_blank');
    expect(bestskyToolsLink.getAttribute('rel')).toBe('noopener noreferrer');

    const bestskyToolsBadge = screen.getByRole('img', { name: 'Featured on BestskyTools' });
    expect(bestskyToolsBadge.getAttribute('src')).toBe(
      'https://assets.bestsky.tools/badges/featured-light.svg',
    );
    expect(bestskyToolsBadge.getAttribute('width')).toBe('74');
    expect(bestskyToolsBadge.getAttribute('height')).toBe('24');

    const dangLink = screen.getByRole('link', { name: 'MPStorys verified on DANG' });
    expect(dangLink.getAttribute('href')).toBe('https://dang.ai');
    expect(dangLink.getAttribute('target')).toBe('_blank');
    expect(dangLink.getAttribute('rel')).toBe('noopener noreferrer');

    const dangBadge = screen.getByRole('img', { name: 'Verified on DANG!' });
    expect(dangBadge.getAttribute('src')).toBe(
      'https://assets.dang.ai/badges/dang-verified-dark.png',
    );
    expect(dangBadge.getAttribute('width')).toBe('66');
    expect(dangBadge.getAttribute('height')).toBe('24');

    const deepLaunchLink = screen.getByRole('link', {
      name: 'MPStorys featured on DeepLaunch.io',
    });
    expect(deepLaunchLink.getAttribute('href')).toBe('https://deeplaunch.io');
    expect(deepLaunchLink.getAttribute('target')).toBe('_blank');
    expect(deepLaunchLink.getAttribute('rel')).toBe('noopener noreferrer');

    const deepLaunchBadge = screen.getByRole('img', { name: 'Featured on DeepLaunch.io' });
    expect(deepLaunchBadge.getAttribute('src')).toBe(
      'https://deeplaunch.io/badge/badge_light.svg',
    );
    expect(deepLaunchBadge.getAttribute('width')).toBe('89');
    expect(deepLaunchBadge.getAttribute('height')).toBe('24');

    const dofollowToolsLink = screen.getByRole('link', {
      name: 'MPStorys featured on Dofollow.Tools',
    });
    expect(dofollowToolsLink.getAttribute('href')).toBe('https://dofollow.tools');
    expect(dofollowToolsLink.getAttribute('target')).toBe('_blank');
    expect(dofollowToolsLink.getAttribute('rel')).toBe('noopener noreferrer');

    const dofollowToolsBadge = screen.getByRole('img', {
      name: 'Featured on Dofollow.Tools',
    });
    expect(dofollowToolsBadge.getAttribute('src')).toBe(
      'https://dofollow.tools/badge/badge_light.svg',
    );
    expect(dofollowToolsBadge.getAttribute('width')).toBe('89');
    expect(dofollowToolsBadge.getAttribute('height')).toBe('24');

    const domainRankLink = screen.getByRole('link', {
      name: 'MPStorys domain rating on DomainRank',
    });
    expect(domainRankLink.getAttribute('href')).toBe('https://domainrank.app');
    expect(domainRankLink.getAttribute('target')).toBe('_blank');
    expect(domainRankLink.getAttribute('rel')).toBe('noopener noreferrer');

    const domainRankBadge = screen.getByRole('img', { name: 'mpstorys.com Domain Rating' });
    expect(domainRankBadge.getAttribute('src')).toBe(
      'https://domainrank.app/api/badge/mpstorys.com?style=small',
    );
    expect(domainRankBadge.getAttribute('width')).toBe('149');
    expect(domainRankBadge.getAttribute('height')).toBe('24');

    const findlyLink = screen.getByRole('link', { name: 'MPStorys featured on Findly.tools' });
    expect(findlyLink.getAttribute('href')).toBe(
      'https://findly.tools/mpstorys?utm_source=mpstorys',
    );
    expect(findlyLink.getAttribute('target')).toBe('_blank');
    expect(findlyLink.getAttribute('rel')).toBe('noopener noreferrer');

    const findlyBadge = screen.getByRole('img', { name: 'Featured on Findly.tools' });
    expect(findlyBadge.getAttribute('src')).toBe(
      'https://findly.tools/badges/findly-tools-badge-light.svg',
    );
    expect(findlyBadge.getAttribute('width')).toBe('76');
    expect(findlyBadge.getAttribute('height')).toBe('24');

    const lovableAppLink = screen.getByRole('link', { name: 'MPStorys on Lovable App' });
    expect(lovableAppLink.getAttribute('href')).toBe('https://lovableapp.org');
    expect(lovableAppLink.getAttribute('target')).toBe('_blank');
    expect(lovableAppLink.getAttribute('rel')).toBe('noopener noreferrer');

    const lovableAppBadge = screen.getByRole('img', { name: 'Lovable App Badge' });
    expect(lovableAppBadge.getAttribute('src')).toBe(
      'https://lovableapp.org/lovable-app-badge.svg',
    );
    expect(lovableAppBadge.getAttribute('width')).toBe('80');
    expect(lovableAppBadge.getAttribute('height')).toBe('24');

    const mossAiToolsLink = screen.getByRole('link', { name: 'MPStorys on MossAI Tools' });
    expect(mossAiToolsLink.getAttribute('href')).toBe('https://mossai.org');
    expect(mossAiToolsLink.getAttribute('target')).toBe('_blank');
    expect(mossAiToolsLink.getAttribute('rel')).toBe('noopener noreferrer');
    expect(mossAiToolsLink.getAttribute('title')).toBe('MossAI Tools');
    expect(mossAiToolsLink.textContent).toBe('MossAI Tools');

    const showMeBestAiLink = screen.getByRole('link', {
      name: 'MPStorys featured on ShowMeBestAI',
    });
    expect(showMeBestAiLink.getAttribute('href')).toBe('https://showmebest.ai');
    expect(showMeBestAiLink.getAttribute('target')).toBe('_blank');
    expect(showMeBestAiLink.getAttribute('rel')).toBe('noopener noreferrer');

    const showMeBestAiBadge = screen.getByRole('img', { name: 'Featured on ShowMeBestAI' });
    expect(showMeBestAiBadge.getAttribute('src')).toBe(
      'https://showmebest.ai/badge/feature-badge-white.webp',
    );
    expect(showMeBestAiBadge.getAttribute('width')).toBe('96');
    expect(showMeBestAiBadge.getAttribute('height')).toBe('24');

    const saasFameLink = screen.getByRole('link', { name: 'MPStorys featured on SaaSFame' });
    expect(saasFameLink.getAttribute('href')).toBe('https://saasfame.com/item/mpstorys');
    expect(saasFameLink.getAttribute('target')).toBe('_blank');
    expect(saasFameLink.getAttribute('rel')).toBe('noopener noreferrer');

    const saasFameBadge = screen.getByRole('img', { name: 'Featured on saasfame.com' });
    expect(saasFameBadge.getAttribute('src')).toBe('https://saasfame.com/badge-light.svg');
    expect(saasFameBadge.getAttribute('width')).toBe('76');
    expect(saasFameBadge.getAttribute('height')).toBe('24');

    const startupFastLink = screen.getByRole('link', { name: 'MPStorys powered by Startup Fast' });
    expect(startupFastLink.getAttribute('href')).toBe('https://startupfa.st');
    expect(startupFastLink.getAttribute('target')).toBe('_blank');
    expect(startupFastLink.getAttribute('rel')).toBe('noopener noreferrer');
    expect(startupFastLink.getAttribute('title')).toBe('Powered by Startup Fast');

    const startupFastBadge = screen.getByRole('img', { name: 'Powered by Startup Fast' });
    expect(startupFastBadge.getAttribute('src')).toBe(
      'https://startupfa.st/images/badges/powered-by-light.svg',
    );
    expect(startupFastBadge.getAttribute('width')).toBe('57');
    expect(startupFastBadge.getAttribute('height')).toBe('24');

    const yoDirectoryLink = screen.getByRole('link', {
      name: 'MPStorys featured on Yo.directory',
    });
    expect(yoDirectoryLink.getAttribute('href')).toBe('https://yo.directory');
    expect(yoDirectoryLink.getAttribute('target')).toBe('_blank');
    expect(yoDirectoryLink.getAttribute('rel')).toBe('noopener noreferrer');
    expect(yoDirectoryLink.getAttribute('title')).toBe('Featured on Yo.directory');
    expect(yoDirectoryLink.textContent).toBe('Featured on Yo.directory');
    expect(screen.queryByRole('img', { name: 'Featured on Yo.directory' })).toBeNull();

    const submitAiToolsLink = screen.getByRole('link', { name: 'MPStorys on Submit AI Tools' });
    expect(submitAiToolsLink.getAttribute('href')).toBe('https://submitaitools.org');
    expect(submitAiToolsLink.getAttribute('target')).toBe('_blank');
    expect(submitAiToolsLink.getAttribute('rel')).toBe('noopener noreferrer');

    const submitAiToolsBadge = screen.getByRole('img', { name: 'Submit AI Tools' });
    expect(submitAiToolsBadge.getAttribute('src')).toBe(
      'https://submitaitools.org/static_submitaitools/images/submitaitools.png',
    );
    expect(submitAiToolsBadge.getAttribute('width')).toBe('72');
    expect(submitAiToolsBadge.getAttribute('height')).toBe('24');

    const submitoLink = screen.getByRole('link', { name: 'MPStorys listed on Submito' });
    expect(submitoLink.getAttribute('href')).toBe('https://submito.net');
    expect(submitoLink.getAttribute('target')).toBe('_blank');
    expect(submitoLink.getAttribute('rel')).toBe('noopener noreferrer');
    expect(submitoLink.getAttribute('title')).toBe('Listed on Submito');

    const submitoBadge = screen.getByRole('img', { name: 'Listed on Submito' });
    expect(submitoBadge.getAttribute('src')).toBe('https://submito.net/badge/listed-light.svg');
    expect(submitoBadge.getAttribute('width')).toBe('84');
    expect(submitoBadge.getAttribute('height')).toBe('24');

    const toolFameLink = screen.getByRole('link', { name: 'MPStorys featured on ToolFame' });
    expect(toolFameLink.getAttribute('href')).toBe('https://toolfame.com/item/mpstorys');
    expect(toolFameLink.getAttribute('target')).toBe('_blank');
    expect(toolFameLink.getAttribute('rel')).toBe('noopener noreferrer');

    const toolFameBadge = screen.getByRole('img', { name: 'Featured on toolfame.com' });
    expect(toolFameBadge.getAttribute('src')).toBe('https://toolfame.com/badge-light.svg');
    expect(toolFameBadge.getAttribute('width')).toBe('71');
    expect(toolFameBadge.getAttribute('height')).toBe('24');

    const turbo0Link = screen.getByRole('link', { name: 'MPStorys listed on Turbo0' });
    expect(turbo0Link.getAttribute('href')).toBe('https://turbo0.com/item/mpstorys');
    expect(turbo0Link.getAttribute('target')).toBe('_blank');
    expect(turbo0Link.getAttribute('rel')).toBe('noopener noreferrer');

    const turbo0Badge = screen.getByRole('img', { name: 'Listed on Turbo0' });
    expect(turbo0Badge.getAttribute('src')).toBe('https://img.turbo0.com/badge-listed-light.svg');
    expect(turbo0Badge.getAttribute('width')).toBe('72');
    expect(turbo0Badge.getAttribute('height')).toBe('24');

    const wiredBusinessLink = screen.getByRole('link', {
      name: 'MPStorys featured on Wired Business',
    });
    expect(wiredBusinessLink.getAttribute('href')).toBe('https://wired.business');
    expect(wiredBusinessLink.getAttribute('target')).toBe('_blank');
    expect(wiredBusinessLink.getAttribute('rel')).toBe('noopener noreferrer');

    const wiredBusinessBadge = screen.getByRole('img', { name: 'Featured on Wired Business' });
    expect(wiredBusinessBadge.getAttribute('src')).toBe('https://wired.business/badge0-light.svg');
    expect(wiredBusinessBadge.getAttribute('width')).toBe('89');
    expect(wiredBusinessBadge.getAttribute('height')).toBe('24');

    const verifiedDrLink = screen.getByRole('link', {
      name: 'Verified domain rating for MPStorys',
    });
    expect(verifiedDrLink.getAttribute('href')).toBe(
      'https://verifieddr.com/website/mpstorys-com',
    );
    expect(verifiedDrLink.getAttribute('target')).toBe('_blank');
    expect(verifiedDrLink.getAttribute('rel')).toBe('noopener noreferrer');

    const verifiedDrBadge = screen.getByRole('img', {
      name: 'Verified DR - Verified Domain Rating for mpstorys.com',
    });
    expect(verifiedDrBadge.getAttribute('src')).toBe(
      'https://verifieddr.com/badge/mpstorys-com.svg?metric=truedr',
    );
    expect(verifiedDrBadge.getAttribute('width')).toBe('85');
    expect(verifiedDrBadge.getAttribute('height')).toBe('24');

    const buildWayLink = screen.getByRole('link', { name: 'MPStorys listed on BuildWay' });
    expect(buildWayLink.getAttribute('href')).toBe('https://www.buildway.cc');
    expect(buildWayLink.getAttribute('target')).toBe('_blank');
    expect(buildWayLink.getAttribute('rel')).toBe('noopener noreferrer');

    const buildWayLogo = screen.getByRole('img', { name: 'Listed on BuildWay' });
    expect(buildWayLogo.getAttribute('src')).toBe('https://www.buildway.cc/logo.png');
    expect(buildWayLogo.getAttribute('width')).toBe('24');
    expect(buildWayLogo.getAttribute('height')).toBe('24');

    const frogDrLink = screen.getByRole('link', {
      name: 'Monitor MPStorys domain rating with FrogDR',
    });
    expect(frogDrLink.getAttribute('href')).toBe(
      'https://frogdr.com/mpstorys.com?utm_source=mpstorys.com',
    );
    expect(frogDrLink.getAttribute('target')).toBe('_blank');
    expect(frogDrLink.getAttribute('rel')).toBe('noopener noreferrer');

    const frogDrBadge = screen.getByRole('img', {
      name: 'Monitor your Domain Rating with FrogDR',
    });
    expect(frogDrBadge.getAttribute('src')).toBe(
      'https://frogdr.com/mpstorys.com/badge-white.svg',
    );
    expect(frogDrBadge.getAttribute('width')).toBe('111');
    expect(frogDrBadge.getAttribute('height')).toBe('24');

    const fazierLink = screen.getByRole('link', { name: 'MPStorys featured on Fazier' });
    expect(fazierLink.getAttribute('href')).toBe('https://fazier.com/launches/mpstorys.com');
    expect(fazierLink.getAttribute('target')).toBe('_blank');
    expect(fazierLink.getAttribute('rel')).toBe('noopener noreferrer');

    const fazierBadge = screen.getByRole('img', { name: 'Fazier badge' });
    expect(fazierBadge.getAttribute('src')).toBe(
      'https://fazier.com/api/v1//public/badges/launch_badges.svg?badge_type=featured&theme=light',
    );
    expect(fazierBadge.getAttribute('width')).toBe('111');
    expect(fazierBadge.getAttribute('height')).toBe('24');
  });
});
