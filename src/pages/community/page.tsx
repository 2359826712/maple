import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Navbar from '@/pages/home/components/Navbar';
import Footer from '@/pages/home/components/Footer';
import NotificationDrawer from '@/pages/home/components/NotificationDrawer';
import AuthRequiredNotice from '@/components/feature/AuthRequiredNotice';
import { communityLinks } from '@/constants/communityLinks';
import { useAuthSession } from '@/hooks/useAuthSession';
import { mapleSqlApi, MapleApiError, type CommunityProposal as ApiCommunityProposal, type CommunityProposalComment } from '@/services/mapleSqlApi';

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

const shortUserLabel = (value?: string | null) => {
  if (!value) return 'Maple SQL User';
  return value.length > 10 ? `${value.slice(0, 8)}...` : value;
};

const fromApiProposal = (proposal: ApiCommunityProposal): Proposal => ({
  id: proposal.id,
  className: proposal.class_name,
  action: proposal.action as ProposalAction,
  kind: proposal.kind as ProposalKind,
  title: proposal.title,
  note: proposal.note,
  status: proposal.status as ProposalStatus,
  author: shortUserLabel(proposal.created_by),
  createdAt: proposal.created_at,
  previousImages: proposal.previous_images,
  proposedImages: proposal.proposed_images,
  votes: proposal.votes,
});

export default function CommunityPage() {
  const { t } = useTranslation();
  const [notifOpen, setNotifOpen] = useState(false);
  const [timeRange, setTimeRange] = useState('1');
  const [statusFilter, setStatusFilter] = useState<'All' | ProposalStatus>('All');
  const [classFilter, setClassFilter] = useState('All');
  const [kindFilter, setKindFilter] = useState<'All' | ProposalKind>('All');
  const [sortBy, setSortBy] = useState('Newest');
  const [showForm, setShowForm] = useState(false);
  const [remoteProposals, setRemoteProposals] = useState<Proposal[]>([]);
  const [comments, setComments] = useState<Record<string, string[]>>({});
  const [activeProposal, setActiveProposal] = useState<Proposal | null>(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [authPrompt, setAuthPrompt] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
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
    if (!isSignedIn) {
      setRemoteProposals([]);
      setComments({});
      setLoading(false);
      setErrorMsg('');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    void mapleSqlApi.community
      .listProposals({
        status: statusFilter === 'All' ? '' : statusFilter,
        className: classFilter === 'All' ? '' : classFilter,
        kind: kindFilter === 'All' ? '' : kindFilter,
        sort: sortBy === 'Most liked' ? 'Score' : sortBy,
      })
      .then((items) => setRemoteProposals(items.map(fromApiProposal)))
      .catch((error) => {
        setErrorMsg(error instanceof MapleApiError ? error.message : 'Failed to load community proposals.');
      })
      .finally(() => setLoading(false));
  }, [classFilter, isSignedIn, kindFilter, sortBy, statusFilter]);

  useEffect(() => {
    if (!activeProposal || !isSignedIn) return;
    void mapleSqlApi.community
      .listProposalComments(activeProposal.id)
      .then((items: CommunityProposalComment[]) => {
        setComments((current) => ({
          ...current,
          [activeProposal.id]: items.map((item) => item.content),
        }));
      })
      .catch(() => {
        // Keep existing comments fallback if comments fail to load.
      });
  }, [activeProposal, isSignedIn]);

  const proposals = useMemo(
    () => (isSignedIn ? remoteProposals : []),
    [isSignedIn, remoteProposals],
  );

  const filteredProposals = useMemo(() => {
    const now = Date.now();
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

    void mapleSqlApi.community
      .voteProposal(proposal.id, delta > 0 ? 1 : -1)
      .then((result) => {
        setRemoteProposals((current) =>
          current.map((item) => (item.id === proposal.id ? { ...item, votes: result.votes } : item)),
        );
        setActiveProposal((current) => (current?.id === proposal.id ? { ...current, votes: result.votes } : current));
      })
      .catch((error) => {
        setErrorMsg(error instanceof MapleApiError ? error.message : 'Failed to vote on proposal.');
      });
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
    setErrorMsg('');
    void mapleSqlApi.community
      .createProposal({
        class_name: form.className,
        action: form.action,
        kind: form.kind,
        title,
        note,
        proposed_images: imageUrl ? [imageUrl] : [],
        previous_images: [],
      })
      .then((created) => {
        const mapped = fromApiProposal(created);
        setRemoteProposals((current) => [mapped, ...current]);
        setActiveProposal(mapped);
        setShowForm(false);
        setForm((current) => ({ ...current, title: '', note: '', imageUrl: '' }));
      })
      .catch((error) => {
        setErrorMsg(error instanceof MapleApiError ? error.message : 'Failed to create proposal.');
      });
  };

  const submitComment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isSignedIn) {
      setAuthPrompt(true);
      return;
    }

    const comment = commentDraft.trim();
    if (!activeProposal || !comment) return;

    void mapleSqlApi.community
      .addProposalComment(activeProposal.id, comment)
      .then(() => {
        setComments((current) => ({
          ...current,
          [activeProposal.id]: [...(current[activeProposal.id] ?? []), comment],
        }));
        setCommentDraft('');
      })
      .catch((error) => {
        setErrorMsg(error instanceof MapleApiError ? error.message : 'Failed to add comment.');
      });
  };

  return (
    <div className="min-h-screen bg-background-50">
      <Navbar onOpenNotifications={() => setNotifOpen(true)} unread={0} />
      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />

      <main id="main-content" tabIndex={-1} className="pt-20 md:pt-24">
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
              {errorMsg && (
                <div className="mb-6 rounded-lg border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-700">
                  {errorMsg}
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
                  {loading && (
                    <div className="rounded-lg border border-background-200 bg-background-100 p-4 text-sm text-foreground-700">
                      Loading proposals...
                    </div>
                  )}
                  {!loading && filteredProposals.length === 0 && (
                    <div className="rounded-lg border border-background-200 bg-background-100 p-8 text-center text-sm text-foreground-700">
                      <i className="ri-database-2-line mb-2 block text-3xl text-foreground-400"></i>
                      {isSignedIn
                        ? 'No verified community proposals are available for these filters.'
                        : 'Sign in to load verified community proposals from the database. Demo proposals are no longer shown.'}
                    </div>
                  )}
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
      <div className="h-28 w-full rounded-md border border-background-200 bg-gradient-to-br from-primary-100 via-background-50 to-accent-100 dark:from-background-200 dark:via-background-100 dark:to-accent-950 p-3 flex flex-col justify-between overflow-hidden">
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
