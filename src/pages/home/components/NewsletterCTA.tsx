import { FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useVersion } from '@/hooks/VersionContext';

export default function NewsletterCTA() {
  const { t } = useTranslation();
  const { versionInfo } = useVersion();
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formEl = event.currentTarget;
    const formData = new FormData(formEl);

    const honeypot = ((formData.get('website_alt') as string) || '').trim();
    if (honeypot) {
      setStatus('success');
      setTimeout(() => setStatus('idle'), 2500);
      return;
    }
    formData.delete('website_alt');

    const payload = new URLSearchParams();
    formData.forEach((v, k) => payload.append(k, v.toString()));

    setStatus('submitting');
    setErrorMsg('');

    try {
      const response = await fetch('https://readdy.ai/api/form/d966rcttfb6ioa7s1l5g', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: payload.toString(),
      });
      const responseText = await response.text();
      let parsed: { code?: string; meta?: { message?: string; detail?: string } } = {};
      try {
        parsed = JSON.parse(responseText);
      } catch {
        parsed = {};
      }
      const serverMsg = parsed?.meta?.message || parsed?.meta?.detail || responseText;
      const isSpam = typeof serverMsg === 'string' && serverMsg.toLowerCase().includes('spam');

      if (response.ok && parsed?.code === 'OK' && !isSpam) {
        setStatus('success');
        formEl.reset();
        setTimeout(() => setStatus('idle'), 3500);
      } else {
        setStatus('error');
        setErrorMsg(
          typeof serverMsg === 'string' && serverMsg.length > 0
            ? serverMsg
            : 'Could not subscribe right now, please try again.'
        );
      }
    } catch {
      setStatus('error');
      setErrorMsg('Network error — please try again in a moment.');
    }
  };

  return (
    <section className="py-14 md:py-20 bg-background-100">
      <div className="w-full px-4 md:px-8">
        <div className="rounded-2xl overflow-hidden bg-primary-500 relative">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "url('https://readdy.ai/api/search-image?query=Whimsical%20cartoon%20fantasy%20MMO%20wide%20scenery%20with%20warm%20sunset%20clouds%20over%20cream%20floating%20islands%2C%20soft%20orange%20teal%20highlights%2C%20painterly%20illustration%20style%2C%20airy%20mood%2C%20high%20detail%2C%20wide%20cinematic%20composition%20with%20negative%20space%20across%20the%20top&width=1600&height=600&seq=maple-cta-bg&orientation=landscape')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          ></div>
          <div className="relative p-6 md:p-12 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="text-background-50">
              <div className="text-xs font-semibold uppercase tracking-wider opacity-95 flex items-center gap-1.5">
                <i className="ri-leaf-fill text-secondary-300 text-xs"></i>
                Weekly {versionInfo.shortLabel} Digest
              </div>
              <h2 className="mt-2 font-heading text-2xl md:text-4xl font-semibold">
                {t('newsletter_title')}
              </h2>
              <p className="mt-3 text-sm md:text-base opacity-95 max-w-lg">
                {t('newsletter_desc')}
              </p>
              <ul className="mt-4 space-y-1.5 text-sm opacity-95">
                <li className="flex items-center gap-2">
                  <i className="ri-check-line text-secondary-200"></i>
                  Sunny Sunday reminders in your timezone
                </li>
                <li className="flex items-center gap-2">
                  <i className="ri-check-line text-secondary-200"></i>
                  Class balance changes summarised for {versionInfo.shortLabel}
                </li>
                <li className="flex items-center gap-2">
                  <i className="ri-check-line text-secondary-200"></i>
                  New Mapler House builds & Familiar combos
                </li>
              </ul>
            </div>

            <form
              onSubmit={onSubmit}
              id="newsletter-signup"
              data-readdy-form
              className="bg-background-50 rounded-xl p-5 md:p-6 border border-primary-300"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-semibold text-foreground-700">First name</span>
                  <input
                    name="first_name"
                    type="text"
                    placeholder="Peachy"
                    required
                    className="mt-1 w-full h-11 rounded-md border border-background-300 bg-background-50 px-3 text-sm outline-none focus:border-primary-500"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-foreground-700">Main IGN</span>
                  <input
                    name="ign"
                    type="text"
                    placeholder="PeachyMule"
                    className="mt-1 w-full h-11 rounded-md border border-background-300 bg-background-50 px-3 text-sm outline-none focus:border-primary-500"
                  />
                </label>
              </div>
              <label className="block mt-3">
                <span className="text-xs font-semibold text-foreground-700">Email address</span>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder={t('newsletter_placeholder')}
                  className="mt-1 w-full h-11 rounded-md border border-background-300 bg-background-50 px-3 text-sm outline-none focus:border-primary-500"
                />
              </label>
              <label className="block mt-3">
                <span className="text-xs font-semibold text-foreground-700">Preferred world</span>
                <select
                  name="world"
                  className="mt-1 w-full h-11 rounded-md border border-background-300 bg-background-50 px-3 text-sm outline-none focus:border-primary-500 cursor-pointer"
                >
                  <option>Bera (Interactive)</option>
                  <option>Scania (Interactive)</option>
                  <option>Kronos (Reboot)</option>
                  <option>Hyperion (Reboot)</option>
                </select>
              </label>

              <div className="field-supplemental" aria-hidden="true">
                <label>
                  Website
                  <input
                    type="text"
                    name="website_alt"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    readOnly
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="mt-4 w-full h-11 rounded-md bg-primary-500 hover:bg-primary-600 text-background-50 dark:text-foreground-950 text-sm font-semibold cursor-pointer whitespace-nowrap disabled:opacity-70"
              >
                {status === 'submitting' ? 'Subscribing...' : t('newsletter_button')}
              </button>

              {status === 'success' && (
                <p className="mt-3 text-sm text-accent-700 flex items-center gap-1">
                  <i className="ri-checkbox-circle-line"></i>
                  You're in! Check your inbox for the welcome tour.
                </p>
              )}
              {status === 'error' && (
                <p className="mt-3 text-sm text-primary-700 flex items-center gap-1">
                  <i className="ri-error-warning-line"></i>
                  {errorMsg}
                </p>
              )}
              <p className="mt-2 text-[11px] text-foreground-600">
                We only send Maple stuff. No spam, no ads, unsubscribe with one click.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}