import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

interface Reply {
  id: string;
  user: string;
  avatar: string;
  badge: string;
  date: string;
  content: string;
  upvotes: number;
}

interface Comment {
  id: string;
  user: string;
  avatar: string;
  badge: string;
  date: string;
  content: string;
  upvotes: number;
  replies: Reply[];
}

interface Props {
  comments: Comment[];
  isSignedIn: boolean;
  onAuthRequired: () => void;
}

function VoteButton({
  value,
  compact,
  isSignedIn,
  onAuthRequired,
}: {
  value: number;
  compact?: boolean;
  isSignedIn: boolean;
  onAuthRequired: () => void;
}) {
  const [count, setCount] = useState(value);
  const [voted, setVoted] = useState<'up' | 'down' | null>(null);

  const up = () => {
    if (!isSignedIn) {
      onAuthRequired();
      return;
    }

    if (voted === 'up') { setCount(count - 1); setVoted(null); }
    else { setCount(count + (voted === 'down' ? 2 : 1)); setVoted('up'); }
  };

  const down = () => {
    if (!isSignedIn) {
      onAuthRequired();
      return;
    }

    if (voted === 'down') { setCount(count + 1); setVoted(null); }
    else { setCount(count - (voted === 'up' ? 2 : 1)); setVoted('down'); }
  };

  return (
    <div className={`flex items-center ${compact ? 'gap-0.5' : 'gap-1'}`}>
      <button onClick={up} className={`cursor-pointer ${voted === 'up' ? 'text-primary-600' : 'text-foreground-500 hover:text-primary-600'}`} aria-label="upvote">
        <i className={compact ? 'ri-arrow-up-s-line text-sm' : 'ri-arrow-up-s-line'}></i>
      </button>
      <span className={`font-semibold ${compact ? 'text-xs' : 'text-sm'} text-foreground-800`}>{count}</span>
      <button onClick={down} className={`cursor-pointer ${voted === 'down' ? 'text-primary-600' : 'text-foreground-500 hover:text-primary-600'}`} aria-label="downvote">
        <i className={compact ? 'ri-arrow-down-s-line text-sm' : 'ri-arrow-down-s-line'}></i>
      </button>
    </div>
  );
}

export default function CommentSection({ comments, isSignedIn, onAuthRequired }: Props) {
  const { t } = useTranslation();
  const [sort, setSort] = useState<'top' | 'new'>('top');
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const sorted = useMemo(() => {
    if (sort === 'top') return [...comments].sort((a, b) => b.upvotes - a.upvotes);
    return [...comments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [comments, sort]);

  const submitComment = () => {
    if (!isSignedIn) {
      onAuthRequired();
      return;
    }

    setNewComment('');
  };

  const submitReply = (_parentId: string) => {
    if (!isSignedIn) {
      onAuthRequired();
      return;
    }

    setReplyTo(null);
    setReplyText('');
  };

  return (
    <section className="rounded-xl border border-background-200 bg-background-50 p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <i className="ri-message-3-line text-primary-600 text-lg"></i>
          <h2 className="font-heading text-xl font-semibold text-foreground-950">
            {t('guide_comments', { count: comments.length })}
          </h2>
        </div>
        <div className="flex items-center gap-1 bg-background-100 rounded-full p-1">
          <button
            onClick={() => setSort('top')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer whitespace-nowrap ${
              sort === 'top' ? 'bg-background-50 text-foreground-950' : 'text-foreground-600'
            }`}
          >
            {t('guide_sort_top')}
          </button>
          <button
            onClick={() => setSort('new')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer whitespace-nowrap ${
              sort === 'new' ? 'bg-background-50 text-foreground-950' : 'text-foreground-600'
            }`}
          >
            {t('guide_sort_new')}
          </button>
        </div>
      </div>

      {/* Write comment */}
      <div className="mb-6 p-4 rounded-lg bg-background-100 border border-background-200">
        <div className="flex gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-200 text-primary-800 flex items-center justify-center font-semibold text-sm flex-shrink-0">
            Y
          </div>
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={t('guide_comment_placeholder')}
              maxLength={500}
              className="w-full h-20 rounded-md border border-background-200 bg-background-50 p-3 text-sm resize-none outline-none focus:border-primary-500 placeholder:text-foreground-500"
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[11px] text-foreground-600">{newComment.length}/500</span>
              <button
                onClick={submitComment}
                disabled={!newComment.trim()}
                className="h-9 px-4 rounded-full bg-primary-500 hover:bg-primary-600 text-background-50 dark:text-foreground-950 text-xs font-semibold cursor-pointer whitespace-nowrap disabled:opacity-50"
              >
                {t('guide_post_comment')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Comments list */}
      <div className="space-y-0 divide-y divide-background-200">
        {sorted.map((cm) => (
          <div key={cm.id} className="py-5 first:pt-0">
            <div className="flex items-start gap-3">
              <img src={cm.avatar} alt={cm.user} className="w-9 h-9 rounded-full object-cover object-top flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-heading font-semibold text-sm text-foreground-950">{cm.user}</span>
                  {cm.badge && (
                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${
                      cm.badge === 'Author' ? 'bg-primary-500 text-background-50' : 'bg-accent-100 text-accent-800'
                    }`}>
                      {cm.badge}
                    </span>
                  )}
                  <span className="text-[11px] text-foreground-600">{cm.date}</span>
                </div>
                <p className="mt-1 text-sm text-foreground-800 leading-relaxed">{cm.content}</p>
                <div className="mt-2 flex items-center gap-4">
                  <VoteButton value={cm.upvotes} compact isSignedIn={isSignedIn} onAuthRequired={onAuthRequired} />
                  <button
                    onClick={() => {
                      if (!isSignedIn) {
                        onAuthRequired();
                        return;
                      }

                      setReplyTo(replyTo === cm.id ? null : cm.id);
                    }}
                    className="text-xs font-semibold text-foreground-600 hover:text-primary-600 cursor-pointer"
                  >
                    <i className="ri-reply-line mr-1"></i>{t('guide_reply')}
                  </button>
                </div>

                {/* Reply input */}
                {replyTo === cm.id && (
                  <div className="mt-3 ml-2 p-3 rounded-lg bg-background-100 border border-background-200">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`${t('guide_reply')} ${cm.user}...`}
                      maxLength={500}
                      className="w-full h-16 rounded-md border border-background-200 bg-background-50 p-2 text-sm resize-none outline-none focus:border-primary-500 placeholder:text-foreground-500"
                    />
                    <div className="mt-2 flex items-center justify-end gap-2">
                      <button
                        onClick={() => { setReplyTo(null); setReplyText(''); }}
                        className="h-8 px-3 rounded-full bg-background-50 border border-background-200 text-xs text-foreground-700 cursor-pointer whitespace-nowrap"
                      >
                        {t('guide_cancel')}
                      </button>
                      <button
                        onClick={() => submitReply(cm.id)}
                        disabled={!replyText.trim()}
                        className="h-8 px-3 rounded-full bg-primary-500 hover:bg-primary-600 text-background-50 text-xs font-semibold cursor-pointer whitespace-nowrap disabled:opacity-50"
                      >
                        {t('guide_reply')}
                      </button>
                    </div>
                  </div>
                )}

                {/* Nested replies */}
                {cm.replies.length > 0 && (
                  <div className="mt-3 ml-4 pl-3 border-l-2 border-background-200 space-y-3">
                    {cm.replies.map((rp) => (
                      <div key={rp.id} className="flex items-start gap-3">
                        <img src={rp.avatar} alt={rp.user} className="w-7 h-7 rounded-full object-cover object-top flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-heading font-semibold text-sm text-foreground-950">{rp.user}</span>
                            {rp.badge && (
                              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-primary-500 text-background-50">
                                {rp.badge}
                              </span>
                            )}
                            <span className="text-[11px] text-foreground-600">{rp.date}</span>
                          </div>
                          <p className="mt-1 text-sm text-foreground-800 leading-relaxed">{rp.content}</p>
                          <div className="mt-1.5">
                            <VoteButton value={rp.upvotes} compact isSignedIn={isSignedIn} onAuthRequired={onAuthRequired} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="mt-4 w-full h-10 rounded-md bg-background-100 hover:bg-background-200 text-sm font-semibold text-foreground-800 cursor-pointer whitespace-nowrap">
        {t('guide_load_more')}
      </button>
    </section>
  );
}
