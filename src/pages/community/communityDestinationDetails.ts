import type { VerifiedSeriesResource } from '@/pages/series/verifiedContent';

export type CommunityDestinationDetails = {
  authority: 'official' | 'player-run';
  operator: string;
  access: string;
  verifiedAt: string;
  canonicalUrl: string;
  verificationSourceUrl: string;
  sections: string[];
  content: string[];
  samples: Array<{
    title: string;
    summary: string;
    url?: string;
  }>;
  caution: string;
};

const pcDestinationDetails: Record<string, CommunityDestinationDetails> = {
  'https://forums.maplestory.nexon.net/': {
    authority: 'official',
    operator: 'Nexon MapleStory',
    access: 'Public to read; a forum account is required to post.',
    verifiedAt: '2026-07-25',
    canonicalUrl: 'https://forums.maplestory.nexon.net/categories',
    verificationSourceUrl: 'https://forums.maplestory.nexon.net/',
    sections: [
      'Announcements',
      'General Chat',
      'Suggestions, Feedback, and Requests',
      'Game Guides',
      'Guilds',
      'Fan Creations',
      'Bug Reporting',
      'Tech Support',
    ],
    content: [
      'Official notices and developer posts alongside longer player discussions.',
      'Dedicated areas for guides, guild recruitment, fan creations, bugs, and technical help.',
      'The forum currently warns that new accounts may require approval before posting.',
    ],
    samples: [
      {
        title: 'Ban Data from 06/18/2026 - 06/24/2026',
        summary: 'A recent developer post surfaced in the forum’s Latest Developer Posts area.',
        url: 'https://forums.maplestory.nexon.net/discussion/35926/ban-data-from-06-18-2026-06-24-2026',
      },
      {
        title: 'Suggestions, Feedback, and Requests',
        summary: 'A dedicated section for event feedback, feature ideas, and comments on game changes.',
        url: 'https://forums.maplestory.nexon.net/categories/suggestions-and-feedback',
      },
    ],
    caution: 'Official sections are first-party; ordinary discussion posts are written by community members.',
  },
  'https://x.com/MapleStory': {
    authority: 'official',
    operator: 'Nexon MapleStory (@MapleStory)',
    access: 'The profile is public; X may require sign-in for some feed and interaction features.',
    verifiedAt: '2026-07-25',
    canonicalUrl: 'https://x.com/MapleStory',
    verificationSourceUrl: 'https://x.com/MapleStory',
    sections: ['Posts', 'Replies', 'Media', 'Official website links'],
    content: [
      'Short official news, event reminders, maintenance notices, and media.',
      'Links back to longer announcements on the official MapleStory website.',
      'Replies and community-facing updates from the verified @MapleStory identity.',
    ],
    samples: [
      {
        title: 'Ride the Lightning Part 2 is nearly here',
        summary: 'An official update post linking players to the Part 2 patch notes.',
        url: 'https://x.com/MapleStory/status/2079723897310642253',
      },
      {
        title: 'Classic World Closed Online Test #2 sign-ups',
        summary: 'An official reminder that the second test registration is open through July 29.',
        url: 'https://x.com/MapleStory/status/2077891901492003044',
      },
    ],
    caution: 'Best for time-sensitive updates; use the linked full announcement for complete rules and dates.',
  },
  'https://www.youtube.com/@MapleStory': {
    authority: 'official',
    operator: 'Nexon MapleStory',
    access: 'Public to watch; a YouTube account is needed to subscribe, comment, or save videos.',
    verifiedAt: '2026-07-25',
    canonicalUrl: 'https://www.youtube.com/@MapleStory',
    verificationSourceUrl: 'https://www.youtube.com/@MapleStory',
    sections: ['Home', 'Videos', 'Shorts', 'Live', 'Playlists', 'Community'],
    content: [
      'Official update previews, event videos, trailers, and feature demonstrations.',
      'Livestreams, showcases, and highlights that are easier to understand visually.',
      'Playlists group related videos so an update or campaign can be followed in order.',
    ],
    samples: [
      {
        title: 'Ride the Lightning 2nd Update | Coming July 22nd | MapleStory',
        summary: 'Official one-minute visual preview for the second summer update.',
        url: 'https://www.youtube.com/watch?v=BlvPFNaxdPo',
      },
      {
        title: 'Ride the Lightning | Coming June 17th | MapleStory',
        summary: 'Official trailer introducing the first Ride the Lightning update.',
        url: 'https://www.youtube.com/watch?v=EvWWhD5HcNk',
      },
    ],
    caution: 'Video summaries can omit detailed eligibility or timing; confirm those on the linked official notice.',
  },
  'https://discord.com/invite/maplestory': {
    authority: 'official',
    operator: 'Nexon MapleStory',
    access: 'A Discord account and acceptance of the server rules are required to join.',
    verifiedAt: '2026-07-25',
    canonicalUrl: 'https://discord.com/invite/maplestory',
    verificationSourceUrl: 'https://forums.maplestory.nexon.net/discussion/32265/maple-discord',
    sections: ['Official announcements', 'Real-time discussion', 'Player help', 'Events and community chat'],
    content: [
      'Fast official announcements and reminders delivered inside Discord.',
      'Real-time conversation, questions, and help from other MapleStory players.',
      'Community activities and topic channels are available after joining and accepting the rules.',
    ],
    samples: [
      {
        title: 'Server identity: MapleStory',
        summary: 'The invite currently resolves to the Discord server named MapleStory.',
        url: 'https://discord.com/invite/maplestory',
      },
      {
        title: 'Permanent official invitation',
        summary: 'The official MapleStory forum identifies this exact invite as the official permanent server link.',
        url: 'https://forums.maplestory.nexon.net/discussion/32265/maple-discord',
      },
    ],
    caution: 'Chat advice is user-generated unless it is posted by an identified Nexon staff account.',
  },
  'https://www.reddit.com/r/Maplestory/': {
    authority: 'player-run',
    operator: 'r/Maplestory moderators and community',
    access: 'Public to read; a Reddit account is required to post, vote, or comment.',
    verifiedAt: '2026-07-25',
    canonicalUrl: 'https://www.reddit.com/r/Maplestory/',
    verificationSourceUrl: 'https://www.reddit.com/r/Maplestory/',
    sections: ['Community highlights', 'New player questions', 'Discussion', 'Information', 'Guides and resources', 'Memes'],
    content: [
      'A pinned New Players & General Questions thread for beginner and returning-player help.',
      'Long-form player discussion, practical answers, guides, achievements, art, and memes.',
      'Posts can be sorted by best, hot, new, top, or rising to find different kinds of discussion.',
    ],
    samples: [
      {
        title: '[Megathread] New Players & General Questions Thread',
        summary: 'The highlighted place for beginner, returning-player, class, world, and progression questions.',
        url: 'https://www.reddit.com/r/Maplestory/',
      },
      {
        title: 'The Current State of GMS: Progress Overshadowed by Repeated Failures',
        summary: 'A highlighted long-form player discussion about service stability and community feedback.',
        url: 'https://www.reddit.com/r/Maplestory/comments/1ukkf5u/the_current_state_of_gms_progress_overshadowed_by/',
      },
    ],
    caution: 'This is a player-run community. Treat gameplay claims as community advice and verify critical details with first-party notices.',
  },
};

export function getCommunityDestinationDetails(
  resource: VerifiedSeriesResource,
): CommunityDestinationDetails {
  const exact = pcDestinationDetails[resource.sourceUrl];
  if (exact) return exact;

  const url = new URL(resource.sourceUrl);
  return {
    authority: resource.sourceLabel.toLowerCase().includes('nexon') ? 'official' : 'player-run',
    operator: resource.sourceLabel,
    access: 'Open the destination to review its current read, sign-in, and posting requirements.',
    verifiedAt: resource.lastChecked || '2026-07-25',
    canonicalUrl: resource.sourceUrl,
    verificationSourceUrl: resource.sourceUrl,
    sections: [resource.category || 'Community', 'Announcements', 'Discussion'],
    content: [
      resource.description,
      'The exact destination is shown below before MPStorys opens a new tab.',
    ],
    samples: [],
    caution: 'Community posts may be user-generated; verify important game details with a first-party source.',
  };
}
