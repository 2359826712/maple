# MapleHub daily-use improvement plan

Last updated: 2026-07-13 (Asia/Shanghai)

## Objective

Turn the current broad MapleStory portal into a daily companion that answers: what should I do today, what resets or expires soon, and what progress can I make now?

## Workspace

- Project: repository root
- Branch at start: `main`
- The worktree already contained extensive user changes. Preserve them and only make targeted edits.

## Implementation sequence

1. Strengthen the personalized homepage dashboard and first-run onboarding.
2. Keep live-content areas useful during loading, empty, and stale states; expose freshness.
3. Connect real notification unread counts and make account/local-storage state explicit.
4. Reduce primary navigation overload while keeping all destinations reachable.
5. Verify with focused tests, type-check, and production build.

## Current status

- [x] Reviewed the existing homepage, checklist, events, navigation, authentication, and live-content architecture.
- [x] Created this resumable record.
- [x] Added persistent machine-readable continuation settings in `CONTINUATION.json`.
- [x] Homepage/dashboard changes implemented.
- [x] Live-content resilience implemented.
- [x] Notification/account/navigation changes implemented.
- [x] Event reminders saved locally and covered by a focused test.
- [x] Type-check, lint, focused tests, and production build passing.
- [ ] Full accessibility suite has one unrelated pre-existing failure because `D:\Desktop\maple_docs\wiki-data-access-strategy.md` is missing.

## Resume instructions

Read this file, then inspect `git diff` only for files listed in the change log below. Continue from the first unchecked implementation item. Do not discard unrelated worktree changes.

## Change log

- `src/pages/home/components/DailyHubSection.tsx`: added first-run daily-dashboard setup prompt and live regional reset countdown.
- `src/pages/home/components/CurrentVersionHighlights.tsx`: added useful fallback destinations when live highlights are unavailable.
- `src/pages/home/components/TodayInMapleSection.tsx`: added visible freshness information.
- `src/pages/home/components/QuickTools.tsx`: changed internal anchors to router navigation.
- `src/hooks/useRealtimeCollection.ts`: persist only successful live-sync timestamps instead of reporting failed attempts as fresh.
- `src/pages/home/components/Navbar.tsx`: reduced desktop primary navigation, added More menu, real unread count loading, and signed-in account identity.
- `src/pages/home/components/NotificationDrawer.tsx`: notification changes now refresh the global unread badge.
- `src/pages/events/page.tsx`: added device-persistent event reminders, urgency sorting, and router-safe checklist navigation.
- `src/pages/events/page.test.tsx`: verifies reminder persistence and removal.
- All four locale files: dashboard, live-content fallback, navigation, account-state, and reminder copy added.

## Verification

- `npm run type-check`: passed.
- `npm run lint`: passed.
- `npm run build`: passed.
- Focused homepage, navbar, event reminder, i18n, and realtime tests: passed (29 tests across the latest focused runs).
- Broader accessibility-focused run: 95/96 passed; the only failure is a missing documentation fixture outside this workspace, not a UI regression.

## Recommended phase 2

1. Expand the checklist from boss-only tracking to configurable account, event, and region-specific dailies.
2. Add opt-in reminder delivery settings while keeping the current device-only reminder state as the safe default.
3. Add weekly history and event-currency goal projections to the returning-player dashboard.
