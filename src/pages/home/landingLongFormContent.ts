export type LandingGuideSection = {
  id: string;
  eyebrow: string;
  title: string;
  paragraphs: string[];
  takeaways: Array<{ title: string; body: string }>;
  links: Array<{ href: string; label: string }>;
};

export type LandingGuideFaq = {
  question: string;
  answer: string;
};

export const landingGuideIntro = {
  eyebrow: 'The complete MapleStory starting guide',
  title: 'One long-form guide to MapleStory news, guides, tools and every active series',
  description: 'MPStorys is designed as a high-context landing page for players who need more than a list of links. The guide below explains how to choose the correct MapleStory game, keep regional information separate, evaluate news and patch notes, plan events, use guides and calculators, and return to official sources when a detail needs confirmation. It turns the homepage into a practical map of the entire resource index while keeping every recommendation attached to a clear game, region and purpose.',
};

export const landingGuideSections: LandingGuideSection[] = [
  {
    id: 'choose-the-right-series',
    eyebrow: '01 · Series first',
    title: 'Choose the correct MapleStory game before using any advice',
    paragraphs: [
      'The MapleStory name now covers several games and platforms, but similar art, classes and terminology do not make their systems interchangeable. Original PC MapleStory, MapleStory Classic World, MapleStory M, MapleStory N, MapleStory Worlds and MapleStory: Idle RPG each have a different service structure. A guide that is accurate for one title may use the wrong client, progression values, event dates or account requirements for another. MPStorys therefore begins with a series choice instead of treating every search result as if it belonged to the same game.',
      'A series-first route reduces the most common type of research error: finding a useful-looking answer without noticing that it describes a different product. The homepage places every active MapleStory title in a separate card, gives each one a dedicated news route, and offers direct paths to guides, events and tools. Once a series is selected, navigation keeps that scope in the URL so later pages can continue to show the correct context. This makes it easier to compare sources without carrying assumptions from another MapleStory game.',
    ],
    takeaways: [
      { title: 'Identify the product', body: 'Confirm whether the page concerns PC MapleStory, Classic World, M, N, Worlds or Idle RPG before following instructions.' },
      { title: 'Keep the scope', body: 'Use series-aware navigation so MapleStory news, guides, events and tools remain attached to the selected title.' },
      { title: 'Verify edge cases', body: 'Open the first-party source when account access, downloads, test eligibility, marketplace rules or service dates matter.' },
    ],
    links: [
      { href: '/news', label: 'Browse MapleStory news and updates' },
      { href: '/series', label: 'Compare every MapleStory series' },
    ],
  },
  {
    id: 'news-patch-notes-maintenance',
    eyebrow: '02 · News workflow',
    title: 'Read MapleStory news, patch notes and maintenance with context',
    paragraphs: [
      'MapleStory news is most useful when the announcement, affected game, region and publication date stay together. A patch note may describe new content, balance changes, event rewards, bug fixes or system requirements, while a maintenance notice may only apply to a specific service window. MPStorys groups MapleStory news and updates into clear routes so players can begin with a concise briefing and then open the original publication for exact wording. The source link remains part of the record instead of being separated from the summary.',
      'This approach matters because headlines alone rarely explain the complete impact of an update. A large patch may contain class changes, new progression systems, limited-time shops, reward claim deadlines and known issues in one document. A maintenance post can later receive corrections. A developer note may describe future direction rather than a live feature. MPStorys treats these as different kinds of information and avoids presenting a roadmap statement as if it were already available in the game. Dates, status and source type provide the boundary.',
    ],
    takeaways: [
      { title: 'Separate announcement types', body: 'Patch notes, maintenance notices, known issues and future plans answer different questions even when they share a date.' },
      { title: 'Check revisions', body: 'Use the linked source to confirm corrections, extended maintenance, reward changes and other details that may be updated later.' },
      { title: 'Preserve regional context', body: 'A GMS announcement does not automatically describe KMS, JMS, TMS or MSEA timing, content or compensation.' },
    ],
    links: [
      { href: '/news', label: 'Open the MapleStory news hub' },
      { href: '/upcoming', label: 'Review upcoming MapleStory updates' },
    ],
  },
  {
    id: 'events-and-upcoming-updates',
    eyebrow: '03 · Event planning',
    title: 'Turn MapleStory events and upcoming updates into a usable schedule',
    paragraphs: [
      'MapleStory events often overlap. A single update can introduce login rewards, coin shops, growth missions, boss challenges, burning effects, seasonal minigames and limited claim periods. Reading the announcement once is not always enough to remember which task starts first or which reward expires earlier. MPStorys keeps event discovery beside MapleStory news and updates so players can move from an announcement to a practical view of active and upcoming content without losing the source context.',
      'A useful event plan begins with four facts: the affected game, the server or region, the start and end window, and the action required from the player. Some events count participation automatically, while others require registration, daily claims, character designation or a final reward collection step. Time zones also matter. MPStorys does not guess missing dates and does not transform an uncertain schedule into a precise deadline. When the official source is incomplete, the safest result is a clearly labeled unknown rather than invented certainty.',
    ],
    takeaways: [
      { title: 'Build around deadlines', body: 'Record registration, participation and reward-claim windows separately when the official event has more than one deadline.' },
      { title: 'Treat previews carefully', body: 'Upcoming MapleStory content can change; keep test information separate from confirmed live-server rules.' },
      { title: 'Match the right calendar', body: 'Mobile, PC, Classic World, N, Worlds and Idle RPG events belong to different schedules even when themes overlap.' },
    ],
    links: [
      { href: '/events', label: 'Find active MapleStory events' },
      { href: '/upcoming', label: 'See upcoming MapleStory updates' },
      { href: '/checklist', label: 'Build a MapleStory checklist' },
    ],
  },
  {
    id: 'guides-wiki-progression',
    eyebrow: '04 · Knowledge',
    title: 'Use MapleStory guides and wiki references to answer the next decision',
    paragraphs: [
      'A strong MapleStory guide should help with a specific decision. Players may need a class overview, boss requirement, equipment explanation, progression route, map reference or system definition. The best starting point depends on whether the question asks for a stable fact or a recommendation. Wiki-style references are useful for names, mechanics and structured details. Guides are better when the player needs priorities, trade-offs or a sequence of actions. MPStorys keeps both paths available and attaches sources wherever a claim can be verified.',
      'Version and region remain important even for apparently universal topics. Class balance, level requirements, reward tables and system availability can change between MapleStory services or between patches. A guide that does not state its context may still contain useful ideas, but exact values should be checked before they influence expensive decisions. The series and region selectors help narrow the search, while source dates make it easier to recognize material that may need a current patch note or official reference.',
    ],
    takeaways: [
      { title: 'Use the right format', body: 'Choose a wiki reference for stable facts and a guide for priorities, sequences, trade-offs and player decisions.' },
      { title: 'Check expensive details', body: 'Verify exact costs, rates, requirements and reward tables before committing valuable MapleStory resources.' },
      { title: 'Connect facts to changes', body: 'Use dated patch notes beside reference pages to understand why a current system differs from an older guide.' },
    ],
    links: [
      { href: '/guides', label: 'Browse MapleStory guides' },
      { href: '/wiki', label: 'Open the MapleStory wiki route' },
      { href: '/wiki/boss', label: 'Find MapleStory boss guides' },
    ],
  },
  {
    id: 'tools-calculators-simulators',
    eyebrow: '05 · Player tools',
    title: 'Use MapleStory tools, calculators and simulators as planning aids',
    paragraphs: [
      'MapleStory tools are valuable because they turn a complicated system into an input, result and repeatable comparison. A Star Force simulator can demonstrate risk over many attempts. A calculator can compare expected costs or progression options. A checklist can preserve tasks that would otherwise be scattered across notes. A ranking view can help locate a character or class context. MPStorys places these utilities near the guides and references that explain what the numbers mean, reducing the gap between calculation and decision.',
      'A simulator is not a guarantee. Random systems can produce results far from an average, and a calculator is only as accurate as its rates, assumptions and selected version. Players should check the displayed server or game before using a result. If the tool supports local saving, the saved state remains a convenience for returning to the same browser rather than an account-backed record. Clearing site data, changing devices or using a private window can remove local progress, so important plans should still be recorded separately.',
    ],
    takeaways: [
      { title: 'Confirm the version', body: 'A technically correct formula can still produce the wrong answer when rates belong to another MapleStory service or patch.' },
      { title: 'Compare scenarios', body: 'Use calculators to examine alternatives and sensitivity instead of treating one simulated outcome as a promise.' },
      { title: 'Understand local storage', body: 'Browser-saved progress is convenient but may disappear when site data is cleared or the player changes devices.' },
    ],
    links: [
      { href: '/mapler-house', label: 'Open MapleStory tools and calculators' },
      { href: '/checklist', label: 'Use the MapleStory checklist' },
      { href: '/rankings', label: 'Browse MapleStory rankings' },
    ],
  },
  {
    id: 'regions-and-languages',
    eyebrow: '06 · Regional clarity',
    title: 'Keep GMS, KMS, JMS, TMS and MSEA MapleStory information separate',
    paragraphs: [
      'Regional PC services can share major MapleStory concepts while releasing them on different dates or with different names, rewards and operational schedules. GMS information is not a universal default, and KMS information is not automatically a live preview for every other region. JMS, TMS and MSEA also maintain their own official announcements and calendars. MPStorys preserves regional labels so a player can understand where a source came from before using it as current advice.',
      'Language and region are related but not identical. An English interface can display a source about a Korean service, while a translated summary still needs to retain the original region. Translation should make discovery easier without erasing source context. The site provides English, Simplified Chinese, Traditional Chinese, Japanese and Korean navigation, but canonical links, publication dates and official destinations remain attached to the underlying record. This helps multilingual players compare MapleStory updates without confusing translation with regional availability.',
    ],
    takeaways: [
      { title: 'Region before recommendation', body: 'Confirm GMS, KMS, JMS, TMS or MSEA before applying dates, balance values, rewards or maintenance information.' },
      { title: 'Translation keeps provenance', body: 'Localized text should remain connected to the original source language, region and canonical publication.' },
      { title: 'Compare explicitly', body: 'Cross-region comparisons are useful when differences are labeled; silent mixing produces unreliable MapleStory advice.' },
    ],
    links: [
      { href: '/news', label: 'Filter regional MapleStory news' },
      { href: '/search', label: 'Search MapleStory in your language' },
    ],
  },
  {
    id: 'verification-and-archive',
    eyebrow: '07 · Source standards',
    title: 'Understand how MPStorys verifies and preserves MapleStory sources',
    paragraphs: [
      'A resource index becomes useful when every entry describes an exact page and an exact purpose. MPStorys prefers first-party sources, official documentation, established wikis and maintained specialist tools. Generic domains are less useful than direct links to the calculator, guide, announcement or reference a player actually needs. News, patch notes, events and independently addressable guides are treated as individual content records so they can be searched, dated and connected to their canonical source.',
      'Verification also means respecting access boundaries. A page blocked by login, anti-bot controls or a paywall is not an invitation to bypass the restriction. The index records only what can be discovered lawfully and reliably, and it avoids private servers, cheats, exploits, suspicious downloads, account sales and other unsafe material. When a capability, region or date cannot be confirmed, a factual unknown is better than a confident guess. This standard keeps MapleStory search results focused on useful and defensible destinations.',
    ],
    takeaways: [
      { title: 'Exact pages first', body: 'A direct MapleStory calculator, article or guide is indexed separately when it has an independently useful purpose.' },
      { title: 'No invented capabilities', body: 'Unknown regions, features, repositories, access methods and event dates remain unknown until a reliable source confirms them.' },
      { title: 'History stays labeled', body: 'Expired or replaced material can remain searchable when dates and status clearly distinguish it from current information.' },
    ],
    links: [
      { href: '/source', label: 'Inspect a verified MapleStory source' },
      { href: '/search', label: 'Search the MapleStory resource index' },
    ],
  },
  {
    id: 'practical-player-workflow',
    eyebrow: '08 · Repeatable process',
    title: 'A practical five-step workflow for finding reliable MapleStory answers',
    paragraphs: [
      'First, choose the MapleStory series. Second, select the region when the question concerns the original PC game. Third, decide whether the need is current news, a scheduled event, a guide, a stable reference or an interactive tool. Fourth, read the on-site summary and note its date, status and assumptions. Fifth, open the official source before acting on a detail that affects spending, eligibility, deadlines or account access. This process is simple enough for daily use and strict enough to prevent many avoidable mistakes.',
      'The workflow also helps when search results are incomplete. If no verified page answers the question, broaden the query inside the same series before switching products or regions. Search for the system name, an official terminology variant, the patch title or a source organization. Do not fill a missing answer with an unrelated MapleStory result merely because it is popular. A clearly scoped absence is more informative than a confident result from the wrong game.',
    ],
    takeaways: [
      { title: 'Scope', body: 'Series and region define which MapleStory information can reasonably answer the question.' },
      { title: 'Classify', body: 'Choose news, events, guides, wiki references, rankings or tools according to the type of decision.' },
      { title: 'Confirm', body: 'Use the attached official source for exact dates, costs, rules, downloads, eligibility and account requirements.' },
    ],
    links: [
      { href: '/search', label: 'Start a MapleStory search' },
      { href: '/guides', label: 'Continue with MapleStory guides' },
      { href: '/feedback', label: 'Suggest a missing MapleStory resource' },
    ],
  },
];

export const landingGuideFaqs: LandingGuideFaq[] = [
  {
    question: 'What is MPStorys?',
    answer: 'MPStorys is a structured MapleStory series hub that connects news, updates, events, guides, wiki references, rankings, calculators, simulators, checklists and verified external sources. It is designed to help players begin with the correct game and region instead of searching unrelated sites from scratch. MPStorys summarizes and organizes information while retaining the canonical source for details that require confirmation.',
  },
  {
    question: 'Which MapleStory games are covered?',
    answer: 'The active scope includes original PC MapleStory, MapleStory Classic World, MapleStory M, MapleStory N, MapleStory Worlds and MapleStory: Idle RPG. Each title has a separate hub because clients, progression systems, schedules, economies, official sources and account requirements can differ. The original PC area also separates GMS, KMS, JMS, TMS and MSEA regional context.',
  },
  {
    question: 'Does MPStorys replace official MapleStory websites?',
    answer: 'No. Official sites remain the source of truth for account access, downloads, service status, maintenance, final patch rules, event eligibility and later corrections. MPStorys improves discovery by keeping summaries, dates, categories and direct source links together. When a decision has meaningful cost or a deadline, players should open the attached first-party page and verify the current wording.',
  },
  {
    question: 'How should I use MapleStory news and updates?',
    answer: 'Use the news hub to identify what changed, which game or region is affected, and which official article contains the complete details. Patch notes, known-issue notices, maintenance posts, developer notes and roadmaps should not be treated as identical. Check publication and revision dates, then confirm exact rewards, compensation, balance values and event windows against the linked source before acting.',
  },
  {
    question: 'Are MapleStory guides valid for every region and version?',
    answer: 'Not always. General strategy can remain useful, but requirements, rates, rewards, class balance and system availability may vary across regions or change over time. Begin with the correct series and server, inspect the guide date, and compare exact values with current patch notes or official documentation. A guide without clear context should be treated as a starting point rather than final authority.',
  },
  {
    question: 'What MapleStory tools are available?',
    answer: 'The site provides routes to calculators, simulators, planners, rankings, search and checklist features, including a Star Force simulator with local browser saving. Tool availability depends on the selected game and region. Results are planning aids rather than guarantees, especially for random systems. Confirm the version and assumptions before using a calculation to make an expensive in-game decision.',
  },
  {
    question: 'Will simulator progress follow me to another device?',
    answer: 'Local save features store progress in the current browser rather than a synchronized player account. They can help you close a tab and return later on the same browser, but clearing site data, using private browsing, changing profiles or moving to another device may remove the saved state. Keep a separate record when the plan is important or difficult to reproduce.',
  },
  {
    question: 'How are MapleStory events handled when dates are unclear?',
    answer: 'MPStorys does not guess missing event dates. A record can remain unknown or provisional until a reliable source confirms the schedule. When registration, participation and reward claims use different windows, each deadline should be considered separately. Players should also verify the official time zone and region because similar events can run on different calendars across MapleStory services.',
  },
  {
    question: 'Can I browse MPStorys in languages other than English?',
    answer: 'The interface supports English, Simplified Chinese, Traditional Chinese, Japanese and Korean navigation. Localized browsing is intended to improve discovery without hiding where a source originated. Region, canonical URL, publication date and source organization remain important even after text is translated. This allows multilingual players to compare MapleStory information while preserving the evidence behind it.',
  },
  {
    question: 'How can I report a missing or incorrect MapleStory resource?',
    answer: 'Use the feedback route to describe the exact page, game, region and function that should be reviewed. A useful submission points to the canonical URL and explains what the page does. MPStorys checks exact URLs, duplicate records, source quality and safety boundaries before treating a destination as verified. Corrections are preferable to silently keeping an outdated or misleading description.',
  },
];

export const landingGuideClosing = {
  eyebrow: 'A dependable starting point',
  title: 'Build a better MapleStory research habit',
  description: 'Choose the game, keep the region visible, match the question to the right module, and verify important details at the source. That sequence turns a large MapleStory information landscape into a repeatable workflow. MPStorys keeps the routes together so the next patch, event, guide or calculation begins with context instead of another round of scattered searching.',
};
