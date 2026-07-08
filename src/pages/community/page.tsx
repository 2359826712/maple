import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Navbar from '@/pages/home/components/Navbar';
import Footer from '@/pages/home/components/Footer';
import NotificationDrawer from '@/pages/home/components/NotificationDrawer';
import AuthRequiredNotice from '@/components/feature/AuthRequiredNotice';
import { communityLinks } from '@/constants/communityLinks';
import { useAuthSession } from '@/hooks/useAuthSession';

type ProposalStatus = 'Pending' | 'Approved' | 'Rejected';
type ProposalAction = 'Add' | 'Update';
type ProposalKind = 'Class overview' | 'HEXA Skill Upgrade Order' | 'Skill Sequence' | 'Burst Rotation' | 'Culvert';

interface Proposal {
  id: string;
  className: string;
  action: ProposalAction;
  kind: ProposalKind;
  title: string;
  note: string;
  status: ProposalStatus;
  author: string;
  createdAt: string;
  previousImages: string[];
  proposedImages: string[];
  votes: number;
}

const USER_PROPOSALS_KEY = 'maplehub-community-submissions';
const PROPOSAL_VOTES_KEY = 'maplehub-community-submission-votes';
const PROPOSAL_COMMENTS_KEY = 'maplehub-community-submission-comments';

const classOptions = [
  'Adele',
  'Angelic Buster',
  'Aran',
  'Bishop',
  'Demon Slayer',
  'Dual Blade',
  'Erel Light',
  'Hayato',
  'Kanna',
  'Lynn',
  'Night Lord',
  'Sia Astelle',
];

const kindOptions: ProposalKind[] = ['Class overview', 'HEXA Skill Upgrade Order', 'Skill Sequence', 'Burst Rotation', 'Culvert'];

const maplerHouseAsset = (fileName: string) =>
  `https://img.maplerhouse.com/pending/guide-assets/fF8hKAnMrOJgIcGrHIcDXtBPXx1aDzCM/${fileName}`;

const communityImages = {
  erelBurst: maplerHouseAsset('cd7ca56c-f625-4411-8968-9d2152f45a83.png'),
  erelHexa: maplerHouseAsset('5f544f51-d055-4881-a2f9-4dbae573372b.png'),
  kannaOverview: maplerHouseAsset('7df464d1-c39a-48eb-8bc8-2017209c295e.webp'),
};

const initialProposals: Proposal[] = [
  {
    id: 'p1',
    className: 'Erel Light',
    action: 'Add',
    kind: 'Burst Rotation',
    title: 'Add guide images',
    note: 'New v.269 job page needs a burst rotation screenshot for the first release pass.',
    status: 'Approved',
    author: 'MaplerWorker',
    createdAt: '2026-06-22T06:22:00Z',
    previousImages: [],
    proposedImages: [communityImages.erelBurst],
    votes: 0,
  },
  {
    id: 'p2',
    className: 'Erel Light',
    action: 'Add',
    kind: 'HEXA Skill Upgrade Order',
    title: 'Add guide images',
    note: 'The HEXA page has text, but needs a clear proposed upgrade order image.',
    status: 'Approved',
    author: 'MaplerWorker',
    createdAt: '2026-06-22T06:22:00Z',
    previousImages: [],
    proposedImages: [communityImages.erelHexa],
    votes: 0,
  },
  {
    id: 'p3',
    className: 'Kanna',
    action: 'Add',
    kind: 'Class overview',
    title: 'Add guide images',
    note: 'Kanna overview needs a clearer image for beginner readers comparing summon coverage.',
    status: 'Approved',
    author: 'MaplerWorker',
    createdAt: '2026-06-20T16:06:00Z',
    previousImages: [],
    proposedImages: [communityImages.kannaOverview],
    votes: 0,
  },
  {
    id: 'p4',
    className: 'Sia Astelle',
    action: 'Update',
    kind: 'Class overview',
    title: 'Add missing content',
    note: 'Replace outdated overview images and add one missing charged-state visual.',
    status: 'Approved',
    author: 'dooger',
    createdAt: '2026-06-20T15:11:00Z',
    previousImages: [communityImages.erelBurst, communityImages.erelHexa],
    proposedImages: [communityImages.kannaOverview, communityImages.erelBurst, communityImages.erelHexa],
    votes: 0,
  },
];

const readStored = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeStored = (key: string, value: unknown) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

const statusStyles: Record<ProposalStatus, string> = {
  Pending: 'bg-secondary-100 text-secondary-900',
  Approved: 'bg-primary-100 text-primary-800',
  Rejected: 'bg-background-200 text-foreground-700',
};

const actionStyles: Record<ProposalAction, string> = {
  Add: 'bg-accent-100 text-accent-800',
  Update: 'bg-primary-100 text-primary-800',
};

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date));

export default function CommunityPage() {
  const { t } = useTranslation();
  const [notifOpen, setNotifOpen] = useState(false);
  const [timeRange, setTimeRange] = useState('1');
  const [statusFilter, setStatusFilter] = useState<'All' | ProposalStatus>('All');
  const [classFilter, setClassFilter] = useState('All');
  const [kindFilter, setKindFilter] = useState<'All' | ProposalKind>('All');
  const [sortBy, setSortBy] = useState('Newest');
  const [showForm, setShowForm] = useState(false);
  const [userProposals, setUserProposals] = useState<Proposal[]>(() => readStored(USER_PROPOSALS_KEY, []));
  const [voteOverrides, setVoteOverrides] = useState<Record<string, number>>(() => readStored(PROPOSAL_VOTES_KEY, {}));
  const [comments, setComments] = useState<Record<string, string[]>>(() => readStored(PROPOSAL_COMMENTS_KEY, {}));
  const [activeProposal, setActiveProposal] = useState<Proposal | null>(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [authPrompt, setAuthPrompt] = useState(false);
  const { isSignedIn } = useAuthSession();
  const [form, setForm] = useState({
    className: 'Erel Light',
    action: 'Add' as ProposalAction,
    kind: 'Class overview' as ProposalKind,
    title: '',
    note: '',
    imageUrl: '',
  });

  useEffect(() => {
    writeStored(USER_PROPOSALS_KEY, userProposals);
  }, [userProposals]);

  useEffect(() => {
    writeStored(PROPOSAL_VOTES_KEY, voteOverrides);
  }, [voteOverrides]);

  useEffect(() => {
    writeStored(PROPOSAL_COMMENTS_KEY, comments);
  }, [comments]);

  const proposals = useMemo(
    () =>
      [...userProposals, ...initialProposals].map((proposal) => ({
        ...proposal,
        votes: voteOverrides[proposal.id] ?? proposal.votes,
      })),
    [userProposals, voteOverrides],
  );

  const filteredProposals = useMemo(() => {
    const now = new Date('2026-07-07T00:00:00Z').getTime();
    const rangeMs = Number(timeRange) * 31 * 24 * 60 * 60 * 1000;

    return proposals
      .filter((proposal) => now - new Date(proposal.createdAt).getTime() <= rangeMs)
      .filter((proposal) => statusFilter === 'All' || proposal.status === statusFilter)
      .filter((proposal) => classFilter === 'All' || proposal.className === classFilter)
      .filter((proposal) => kindFilter === 'All' || proposal.kind === kindFilter)
      .sort((a, b) => {
        if (sortBy === 'Score') return b.votes - a.votes;
        if (sortBy === 'Most liked') return Math.max(b.votes, 0) - Math.max(a.votes, 0);
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [classFilter, kindFilter, proposals, sortBy, statusFilter, timeRange]);

  const setVote = (proposal: Proposal, delta: number) => {
    if (!isSignedIn) {
      setAuthPrompt(true);
      return;
    }

    setVoteOverrides((current) => ({
      ...current,
      [proposal.id]: (current[proposal.id] ?? proposal.votes) + delta,
    }));
  };

  const submitProposal = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isSignedIn) {
      setAuthPrompt(true);
      return;
    }

    const title = form.title.trim();
    const note = form.note.trim();
    if (!title || !note) return;

    const imageUrl = form.imageUrl.trim();
    const proposal: Proposal = {
      id: `user-${Date.now()}`,
      className: form.className,
      action: form.action,
      kind: form.kind,
      title,
      note,
      status: 'Pending',
      author: t('community_post_user'),
      createdAt: new Date().toISOString(),
      previousImages: [],
      proposedImages: imageUrl ? [imageUrl] : [],
      votes: 0,
    };

    setUserProposals((current) => [proposal, ...current]);
    setActiveProposal(proposal);
    setShowForm(false);
    setForm((current) => ({ ...current, title: '', note: '', imageUrl: '' }));
  };

  const submitComment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isSignedIn) {
      setAuthPrompt(true);
      return;
    }

    const comment = commentDraft.trim();
    if (!activeProposal || !comment) return;

    setComments((current) => ({
      ...current,
      [activeProposal.id]: [...(current[activeProposal.id] ?? []), comment],
    }));
    setCommentDraft('');
  };

  return (
    <div className="min-h-screen bg-background-50">
      <Navbar onOpenNotifications={() => setNotifOpen(true)} unread={3} />
      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />

      <main className="pt-20 md:pt-24">
        <section className="py-10 md:py-14">
          <div className="w-full px-4 md:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
                <div>
                  <div className="text-xs font-semibold text-primary-600 uppercase tracking-wider flex items-center gap-1.5">
                    <i className="ri-leaf-fill text-primary-500 text-[10px]"></i>
                    {t('community_submissions_eyebrow')}
                  </div>
                  <h1 className="mt-2 font-heading text-3xl md:text-5xl font-semibold text-foreground-950">
                    {t('community_submissions_title')}
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm md:text-base text-foreground-600">
                    {t('community_submissions_desc')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!isSignedIn) {
                      setAuthPrompt(true);
                      setShowForm(false);
                      return;
                    }

                    setShowForm((value) => !value);
                  }}
                  className="h-10 px-4 rounded-full bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-semibold cursor-pointer whitespace-nowrap inline-flex items-center justify-center gap-1.5"
                >
                  <i className={showForm ? 'ri-close-line' : 'ri-add-line'}></i>
                  {showForm ? t('community_cancel') : t('community_submit_proposal')}
                </button>
              </div>

              {authPrompt && (
                <div className="mb-6">
                  <AuthRequiredNotice onDismiss={() => setAuthPrompt(false)} />
                </div>
              )}

              {showForm && (
                <form data-testid="proposal-form" onSubmit={submitProposal} className="mb-6 rounded-lg border border-primary-200 bg-background-50 p-4 md:p-5">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <label className="block">
                      <span className="text-[11px] font-semibold text-foreground-600 uppercase">{t('community_filter_class')}</span>
                      <select
                        value={form.className}
                        onChange={(event) => setForm((current) => ({ ...current, className: event.target.value }))}
                        className="mt-1 w-full h-10 rounded-lg border border-background-200 bg-background-50 px-3 text-sm outline-none focus:border-primary-400"
                      >
                        {classOptions.map((className) => (
                          <option key={className}>{className}</option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-[11px] font-semibold text-foreground-600 uppercase">{t('community_filter_kind')}</span>
                      <select
                        value={form.kind}
                        onChange={(event) => setForm((current) => ({ ...current, kind: event.target.value as ProposalKind }))}
                        className="mt-1 w-full h-10 rounded-lg border border-background-200 bg-background-50 px-3 text-sm outline-none focus:border-primary-400"
                      >
                        {kindOptions.map((kind) => (
                          <option key={kind}>{kind}</option>
                        ))}
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-[11px] font-semibold text-foreground-600 uppercase">{t('community_action')}</span>
                      <select
                        value={form.action}
                        onChange={(event) => setForm((current) => ({ ...current, action: event.target.value as ProposalAction }))}
                        className="mt-1 w-full h-10 rounded-lg border border-background-200 bg-background-50 px-3 text-sm outline-none focus:border-primary-400"
                      >
                        <option>Add</option>
                        <option>Update</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-[11px] font-semibold text-foreground-600 uppercase">{t('community_image_url')}</span>
                      <input
                        value={form.imageUrl}
                        onChange={(event) => setForm((current) => ({ ...current, imageUrl: event.target.value }))}
                        placeholder="https://..."
                        className="mt-1 w-full h-10 rounded-lg border border-background-200 bg-background-50 px-3 text-sm outline-none focus:border-primary-400"
                      />
                    </label>
                  </div>
                  <input
                    data-testid="proposal-title"
                    value={form.title}
                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                    placeholder={t('community_proposal_title_placeholder')}
                    className="mt-3 w-full h-10 rounded-lg border border-background-200 bg-background-50 px-3 text-sm outline-none focus:border-primary-400"
                  />
                  <textarea
                    data-testid="proposal-note"
                    value={form.note}
                    onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
                    placeholder={t('community_proposal_note_placeholder')}
                    rows={3}
                    className="mt-3 w-full resize-none rounded-lg border border-background-200 bg-background-50 px-3 py-2 text-sm outline-none focus:border-primary-400"
                  />
                  <button
                    type="submit"
                    data-testid="proposal-submit"
                    disabled={!form.title.trim() || !form.note.trim()}
                    className="mt-3 h-10 px-4 rounded-full bg-primary-500 hover:bg-primary-600 disabled:bg-background-300 disabled:text-foreground-500 text-background-50 text-sm font-semibold cursor-pointer disabled:cursor-not-allowed whitespace-nowrap inline-flex items-center gap-1.5"
                  >
                    <i className="ri-send-plane-fill"></i>
                    {t('community_create_proposal')}
                  </button>
                </form>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
                <aside className="lg:sticky lg:top-24 h-fit rounded-lg border border-background-200 bg-background-100 p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                    <FilterSelect label={t('community_time_range')} value={timeRange} onChange={setTimeRange}>
                      <option value="1">{t('community_past_month')}</option>
                      <option value="2">{t('community_past_2_months')}</option>
                      <option value="3">{t('community_past_3_months')}</option>
                    </FilterSelect>
                    <FilterSelect label={t('community_filter_status')} value={statusFilter} onChange={(value) => setStatusFilter(value as 'All' | ProposalStatus)}>
                      <option value="All">{t('community_all_statuses')}</option>
                      <option value="Pending">{t('community_status_pending')}</option>
                      <option value="Approved">{t('community_status_approved')}</option>
                      <option value="Rejected">{t('community_status_rejected')}</option>
                    </FilterSelect>
                    <FilterSelect label={t('community_filter_class')} value={classFilter} onChange={setClassFilter}>
                      <option value="All">{t('community_all_classes')}</option>
                      {classOptions.map((className) => (
                        <option key={className}>{className}</option>
                      ))}
                    </FilterSelect>
                    <FilterSelect label={t('community_filter_kind')} value={kindFilter} onChange={(value) => setKindFilter(value as 'All' | ProposalKind)}>
                      <option value="All">{t('community_all_kinds')}</option>
                      {kindOptions.map((kind) => (
                        <option key={kind}>{kind}</option>
                      ))}
                    </FilterSelect>
                    <FilterSelect label={t('community_sort')} value={sortBy} onChange={setSortBy}>
                      <option>Newest</option>
                      <option>Score</option>
                      <option>Most liked</option>
                    </FilterSelect>
                  </div>
                  <div className="mt-4 pt-4 border-t border-background-200">
                    <a
                      href={communityLinks.discord}
                      target="_blank"
                      rel="noreferrer"
                      className="h-10 w-full rounded-full bg-accent-500 hover:bg-accent-600 text-background-50 text-sm font-semibold inline-flex items-center justify-center gap-1.5"
                    >
                      <i className="ri-discord-fill"></i>
                      Discord
                    </a>
                  </div>
                </aside>

                <div className="space-y-4">
                  {filteredProposals.map((proposal) => (
                    <ProposalCard
                      key={proposal.id}
                      proposal={proposal}
                      comments={comments[proposal.id] ?? []}
                      onVote={setVote}
                      onOpen={() => setActiveProposal(proposal)}
                      t={t}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {activeProposal && (
        <div className="fixed inset-0 z-50 bg-foreground-950/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-lg bg-background-50 border border-primary-200/50 shadow-xl">
            <div className="p-5 border-b border-background-200 flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${actionStyles[activeProposal.action]}`}>{activeProposal.action}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusStyles[activeProposal.status]}`}>{activeProposal.status}</span>
                </div>
                <h2 className="font-heading text-xl font-semibold text-foreground-950">{activeProposal.className}</h2>
                <p className="text-sm text-foreground-700">{activeProposal.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveProposal(null)}
                className="w-9 h-9 rounded-full bg-background-100 hover:bg-background-200 text-foreground-700 flex items-center justify-center cursor-pointer"
                aria-label={t('community_close')}
              >
                <i className="ri-close-line"></i>
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm leading-relaxed text-foreground-800">{activeProposal.note}</p>
              <ImageComparison proposal={activeProposal} t={t} />
              <div className="mt-5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setVote(activeProposal, 1)}
                  className="h-9 px-3 rounded-full bg-background-100 hover:bg-primary-50 text-foreground-800 text-xs font-semibold cursor-pointer"
                >
                  <i className="ri-thumb-up-line mr-1"></i>
                  {activeProposal.votes + 1}
                </button>
                <button
                  type="button"
                  onClick={() => setVote(activeProposal, -1)}
                  className="h-9 px-3 rounded-full bg-background-100 hover:bg-background-200 text-foreground-800 text-xs font-semibold cursor-pointer"
                >
                  <i className="ri-thumb-down-line mr-1"></i>
                  {Math.max(activeProposal.votes - 1, 0)}
                </button>
              </div>

              <div className="mt-5 space-y-3">
                {(comments[activeProposal.id] ?? []).map((comment, index) => (
                  <div key={`${comment}-${index}`} className="rounded-lg border border-background-200 bg-background-100 p-3 text-sm text-foreground-800">
                    <div className="text-[11px] font-semibold text-foreground-500 mb-1">{t('community_reply_you')}</div>
                    {comment}
                  </div>
                ))}
              </div>

              <form onSubmit={submitComment} className="mt-4 flex gap-2">
                <input
                  value={commentDraft}
                  onChange={(event) => setCommentDraft(event.target.value)}
                  placeholder={t('community_reply_placeholder')}
                  className="min-w-0 flex-1 h-10 rounded-full border border-background-300 bg-background-50 px-4 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10"
                />
                <button
                  type="submit"
                  className="h-10 px-4 rounded-full bg-primary-500 hover:bg-primary-600 text-background-50 text-sm font-semibold cursor-pointer whitespace-nowrap"
                >
                  {t('community_reply_submit')}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase text-foreground-600">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full h-10 rounded-lg border border-background-200 bg-background-50 px-3 text-sm text-foreground-900 outline-none focus:border-primary-400"
      >
        {children}
      </select>
    </label>
  );
}

function ProposalCard({
  proposal,
  comments,
  onVote,
  onOpen,
  t,
}: {
  proposal: Proposal;
  comments: string[];
  onVote: (proposal: Proposal, delta: number) => void;
  onOpen: () => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  return (
    <article className="rounded-lg border border-background-200 bg-background-50 p-4 md:p-5">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <a href="/mapler-house#stats" className="font-heading font-semibold text-primary-700 hover:text-primary-800">
              {proposal.className}
            </a>
            <span className={`px-2 py-0.5 rounded-full font-semibold ${actionStyles[proposal.action]}`}>{proposal.action}</span>
            <span className="text-foreground-500">|</span>
            <span className="font-semibold text-foreground-700">{proposal.kind}</span>
          </div>
          <h3 className="mt-2 font-heading text-lg font-semibold text-foreground-950">{proposal.title}</h3>
          <p className="mt-1 text-sm text-foreground-700 leading-relaxed">{proposal.note}</p>
        </div>
        <span className={`w-fit px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusStyles[proposal.status]}`}>
          {proposal.status}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onVote(proposal, 1)}
          className="h-8 px-3 rounded-full bg-background-100 hover:bg-primary-50 text-xs font-semibold text-foreground-800 cursor-pointer"
        >
          <i className="ri-thumb-up-line mr-1"></i>
          {Math.max(proposal.votes, 0)}
        </button>
        <button
          type="button"
          onClick={() => onVote(proposal, -1)}
          className="h-8 px-3 rounded-full bg-background-100 hover:bg-background-200 text-xs font-semibold text-foreground-800 cursor-pointer"
        >
          <i className="ri-thumb-down-line mr-1"></i>
          0
        </button>
        <span className="text-xs text-foreground-600">{t('community_net_likes', { count: proposal.votes })}</span>
      </div>

      <ImageComparison proposal={proposal} t={t} />

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-foreground-600">
        <div>
          <span className="font-semibold text-foreground-800">{proposal.author}</span>
          <span className="mx-1.5">·</span>
          <span>{formatDate(proposal.createdAt)}</span>
        </div>
        <button
          type="button"
          onClick={onOpen}
          className="h-9 px-3 rounded-full bg-background-100 hover:bg-accent-50 text-foreground-800 text-xs font-semibold cursor-pointer whitespace-nowrap"
        >
          <i className="ri-message-2-line mr-1"></i>
          {t('community_comments_count', { count: comments.length })}
        </button>
      </div>
    </article>
  );
}

function ImageComparison({ proposal, t }: { proposal: Proposal; t: (key: string) => string }) {
  return (
    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
      <ImageGroup title={t('community_previous_version')} images={proposal.previousImages} emptyLabel={t('community_no_image')} />
      <ImageGroup title={t('community_proposed_version')} images={proposal.proposedImages} emptyLabel={t('community_no_image')} />
    </div>
  );
}

function ImageGroup({ title, images, emptyLabel }: { title: string; images: string[]; emptyLabel: string }) {
  return (
    <div className="rounded-lg border border-background-200 bg-background-100 p-3">
      <div className="text-xs font-semibold text-foreground-700 mb-2">
        {title} · {images.length}
      </div>
      {images.length === 0 ? (
        <div className="h-32 rounded-md border border-dashed border-background-300 bg-background-50 text-foreground-500 text-sm flex items-center justify-center">
          {emptyLabel}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {images.slice(0, 4).map((image, index) => (
            <CommunityImage key={`${image}-${index}`} src={image} alt={title} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}

function CommunityImage({ src, alt, index }: { src: string; alt: string; index: number }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="h-28 w-full rounded-md border border-background-200 bg-gradient-to-br from-primary-100 via-background-50 to-accent-100 p-3 flex flex-col justify-between overflow-hidden">
        <div className="h-7 w-7 rounded-md bg-primary-500/15 text-primary-700 flex items-center justify-center">
          <i className="ri-image-line"></i>
        </div>
        <div>
          <div className="h-2 w-16 rounded-full bg-primary-300/70 mb-1.5"></div>
          <div className="h-2 w-24 rounded-full bg-accent-300/60"></div>
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`${alt} ${index + 1}`}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-28 w-full rounded-md object-cover object-top border border-background-200 bg-background-50"
    />
  );
}
