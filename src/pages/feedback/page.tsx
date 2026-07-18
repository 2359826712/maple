import { type FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Navbar from '@/pages/home/components/Navbar';
import Footer from '@/pages/home/components/Footer';
import NotificationDrawer from '@/pages/home/components/NotificationDrawer';
import { useAuthSession } from '@/hooks/useAuthSession';
import { mapleSqlApi, MapleApiError } from '@/services/mapleSqlApi';

const feedbackCategories = ['bug', 'suggestion', 'content', 'other'] as const;
type FeedbackCategory = (typeof feedbackCategories)[number];

export default function FeedbackPage() {
  const { t, i18n } = useTranslation();
  const { session } = useAuthSession();
  const [notifOpen, setNotifOpen] = useState(false);
  const [category, setCategory] = useState<FeedbackCategory>('suggestion');
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [contactEmail, setContactEmail] = useState(session?.email || '');
  const [submitting, setSubmitting] = useState(false);
  const [receiptId, setReceiptId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const submitFeedback = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setReceiptId('');
    setErrorMessage('');
    try {
      const result = await mapleSqlApi.feedback.create({
        category,
        subject: title.trim(),
        details: details.trim(),
        contact_email: contactEmail.trim(),
        locale: i18n.language,
        page_url: window.location.href,
      });
      setReceiptId(result.id);
      setTitle('');
      setDetails('');
    } catch (error) {
      setErrorMessage(error instanceof MapleApiError ? error.message : t('feedback_submit_error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-50 text-foreground-900">
      <Navbar onOpenNotifications={() => setNotifOpen(true)} unread={0} />
      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />

      <main id="main-content" tabIndex={-1} className="pb-16 pt-24 md:pt-28">
        <div className="mx-auto max-w-5xl px-4 md:px-8">
          <section className="overflow-hidden rounded-3xl border border-primary-200 bg-gradient-to-br from-primary-50 via-background-50 to-accent-50 px-6 py-10 md:px-10 md:py-12">
            <div className="max-w-2xl">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-600 text-2xl text-white shadow-sm">
                <i className="ri-chat-smile-3-line" aria-hidden="true" />
              </span>
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-primary-700">{t('feedback_eyebrow')}</p>
              <h1 className="mt-2 font-heading text-3xl font-semibold text-foreground-950 md:text-4xl">{t('feedback_title')}</h1>
              <p className="mt-3 max-w-xl text-sm leading-7 text-foreground-600 md:text-base">{t('feedback_intro')}</p>
            </div>
          </section>

          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <form onSubmit={submitFeedback} className="rounded-2xl border border-background-200 bg-white p-6 shadow-sm md:p-8">
              <h2 className="font-heading text-xl font-semibold text-foreground-950">{t('feedback_form_title')}</h2>
              <p className="mt-1 text-sm text-foreground-600">{t('feedback_form_desc')}</p>

              <label className="mt-6 block text-sm font-semibold text-foreground-800" htmlFor="feedback-category">
                {t('feedback_category_label')}
              </label>
              <select
                id="feedback-category"
                value={category}
                onChange={(event) => setCategory(event.target.value as FeedbackCategory)}
                className="mt-2 h-11 w-full rounded-xl border border-background-300 bg-background-50 px-3 text-sm text-foreground-900 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              >
                {feedbackCategories.map((value) => (
                  <option key={value} value={value}>{t(`feedback_category_${value}`)}</option>
                ))}
              </select>

              <label className="mt-5 block text-sm font-semibold text-foreground-800" htmlFor="feedback-title">
                {t('feedback_subject_label')}
              </label>
              <input
                id="feedback-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                maxLength={120}
                placeholder={t('feedback_subject_placeholder')}
                className="mt-2 h-11 w-full rounded-xl border border-background-300 bg-background-50 px-3 text-sm text-foreground-900 outline-none transition placeholder:text-foreground-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />

              <label className="mt-5 block text-sm font-semibold text-foreground-800" htmlFor="feedback-details">
                {t('feedback_details_label')}
              </label>
              <textarea
                id="feedback-details"
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                required
                minLength={10}
                maxLength={4000}
                rows={8}
                placeholder={t('feedback_details_placeholder')}
                className="mt-2 w-full resize-y rounded-xl border border-background-300 bg-background-50 px-3 py-3 text-sm leading-6 text-foreground-900 outline-none transition placeholder:text-foreground-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />

              <label className="mt-5 block text-sm font-semibold text-foreground-800" htmlFor="feedback-email">
                {t('feedback_email_label')}
              </label>
              <input
                id="feedback-email"
                type="email"
                value={contactEmail}
                onChange={(event) => setContactEmail(event.target.value)}
                maxLength={320}
                placeholder={t('feedback_email_placeholder')}
                className="mt-2 h-11 w-full rounded-xl border border-background-300 bg-background-50 px-3 text-sm text-foreground-900 outline-none transition placeholder:text-foreground-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              />

              <button
                type="submit"
                disabled={submitting}
                className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary-600 px-6 text-sm font-semibold text-white transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
              >
                <i className={`${submitting ? 'ri-loader-4-line animate-spin' : 'ri-send-plane-2-line'}`} aria-hidden="true" />
                {t(submitting ? 'feedback_submitting' : 'feedback_submit')}
              </button>

              <p aria-live="polite" className={`mt-3 text-xs leading-5 ${errorMessage ? 'text-red-700' : receiptId ? 'text-green-700' : 'text-foreground-500'}`}>
                {errorMessage || (receiptId ? t('feedback_saved', { id: receiptId.slice(0, 8) }) : t('feedback_submit_note'))}
              </p>
            </form>

            <aside className="h-fit rounded-2xl border border-background-200 bg-background-100 p-6">
              <i className="ri-lightbulb-flash-line text-2xl text-primary-600" aria-hidden="true" />
              <h2 className="mt-4 font-heading text-lg font-semibold text-foreground-950">{t('feedback_tips_title')}</h2>
              <p className="mt-2 text-sm leading-6 text-foreground-600">{t('feedback_tips_desc')}</p>
              <div className="mt-5 rounded-xl border border-primary-200 bg-primary-50 p-4 text-xs leading-5 text-primary-900">
                <i className="ri-shield-check-line mr-1" aria-hidden="true" />
                {t('feedback_privacy_note')}
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
