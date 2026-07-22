import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useVersion } from '@/hooks/VersionContext';
import { localizeHref } from '@/i18n/languageRouting';
import {
  landingGuideClosing,
  landingGuideFaqs,
  landingGuideIntro,
  landingGuideSections,
} from '../landingLongFormContent';

const quickLinks = [
  ['ri-newspaper-line', '/news', 'News'],
  ['ri-calendar-event-line', '/events', 'Events'],
  ['ri-book-open-line', '/guides', 'Guides'],
  ['ri-tools-line', '/mapler-house', 'Tools'],
  ['ri-book-2-line', '/wiki', 'Wiki'],
  ['ri-bar-chart-box-line', '/rankings', 'Rankings'],
] as const;

export default function HomeLongFormGuide() {
  const { i18n } = useTranslation();
  const { version } = useVersion();
  const language = i18n.resolvedLanguage || i18n.language;
  const localized = (href: string) => localizeHref(href, language, version);

  if (!language.toLowerCase().startsWith('en')) return null;

  return (
    <section id="complete-maplestory-guide" lang="en" className="border-t border-[#d9d0c2] bg-[#f5f0e7] text-[#171411]">
      <div className="mx-auto max-w-[90rem] px-4 py-16 md:px-8 md:py-24">
        <div className="grid gap-10 lg:grid-cols-[.78fr_1.22fr] lg:items-end">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#a66500]">{landingGuideIntro.eyebrow}</p>
            <h2 className="mt-4 max-w-3xl font-heading text-4xl font-semibold tracking-[-0.035em] md:text-6xl">{landingGuideIntro.title}</h2>
          </div>
          <div>
            <p className="max-w-3xl text-base leading-8 text-[#6e665d] md:text-lg">{landingGuideIntro.description}</p>
            <nav aria-label="MapleStory guide quick links" className="mt-6 flex flex-wrap gap-2">
              {quickLinks.map(([icon, href, label]) => (
                <Link key={href} to={localized(href)} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#d9d0c2] bg-white px-4 text-xs font-extrabold transition hover:border-[#171411] hover:bg-[#171411] hover:text-white">
                  <i className={icon} aria-hidden="true" />
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <nav aria-label="Complete MapleStory guide chapters" className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-[#d9d0c2] bg-[#d9d0c2] sm:grid-cols-2 lg:grid-cols-4">
          {landingGuideSections.map((section) => (
            <a key={section.id} href={`#${section.id}`} className="group flex min-h-28 flex-col justify-between bg-white p-5 transition hover:bg-[#fff3cd]">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#a66500]">{section.eyebrow}</span>
              <span className="mt-4 text-sm font-extrabold leading-5 text-[#3f3933] group-hover:text-[#171411]">{section.title}</span>
            </a>
          ))}
        </nav>
      </div>

      <div>
        {landingGuideSections.map((section, index) => (
          <article key={section.id} id={section.id} data-testid="long-form-section" className={`scroll-mt-24 border-t border-[#d9d0c2] ${index % 2 === 0 ? 'bg-[#fffaf2]' : 'bg-[#f5f0e7]'}`}>
            <div className="mx-auto grid max-w-[90rem] gap-10 px-4 py-16 md:px-8 md:py-24 lg:grid-cols-[.68fr_1.32fr] lg:gap-16">
              <header className="lg:sticky lg:top-28 lg:self-start">
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#a66500]">{section.eyebrow}</p>
                <h2 className="mt-4 font-heading text-3xl font-semibold leading-tight tracking-[-0.03em] md:text-5xl">{section.title}</h2>
                <div className="mt-7 flex flex-wrap gap-2">
                  {section.links.map((link) => (
                    <Link key={link.href} to={localized(link.href)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-[#d9d0c2] bg-white px-3 text-xs font-extrabold text-[#4f4840] transition hover:border-[#171411] hover:bg-[#171411] hover:text-white">
                      {link.label}
                      <i className="ri-arrow-right-line" aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              </header>

              <div>
                <div className="space-y-5 text-[15px] leading-8 text-[#5f574f] md:text-base">
                  {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </div>
                <div className="mt-9 grid gap-3 md:grid-cols-3">
                  {section.takeaways.map((takeaway) => (
                    <section key={takeaway.title} className="rounded-xl border border-[#d9d0c2] bg-white p-5">
                      <h3 className="font-heading text-lg font-semibold">{takeaway.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-[#6e665d]">{takeaway.body}</p>
                    </section>
                  ))}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <section id="maplestory-faq" className="border-t border-[#d9d0c2] bg-[#0f0e0d] text-white">
        <div className="mx-auto grid max-w-[90rem] gap-12 px-4 py-16 md:px-8 md:py-24 lg:grid-cols-[.68fr_1.32fr]">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#ffb000]">MapleStory FAQ</p>
            <h2 className="mt-4 font-heading text-4xl font-semibold tracking-[-0.035em] md:text-6xl">Common questions about the complete MPStorys hub</h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-white/55">These answers explain the boundaries, sources and practical use of the MapleStory landing page.</p>
          </div>
          <div className="space-y-3">
            {landingGuideFaqs.map((faq) => (
              <details key={faq.question} open data-testid="long-form-faq" className="group rounded-xl border border-white/10 bg-white/[0.04] p-5 open:bg-white/[0.06]">
                <summary className="cursor-pointer list-none pr-8 font-heading text-lg font-semibold text-[#fffaf2] marker:hidden">{faq.question}</summary>
                <p className="mt-4 border-t border-white/10 pt-4 text-sm leading-7 text-white/60">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[#d9d0c2] bg-[#ffb000]">
        <div className="mx-auto grid max-w-[90rem] gap-8 px-4 py-14 md:px-8 md:py-20 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#684400]">{landingGuideClosing.eyebrow}</p>
            <h2 className="mt-3 max-w-4xl font-heading text-4xl font-semibold tracking-[-0.035em] md:text-5xl">{landingGuideClosing.title}</h2>
            <p className="mt-5 max-w-4xl text-base leading-8 text-[#4c370b]">{landingGuideClosing.description}</p>
          </div>
          <a href="#choose-your-series" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#171411] px-7 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[#4c370b]">
            Choose your MapleStory series
            <i className="ri-arrow-up-line" aria-hidden="true" />
          </a>
        </div>
      </section>
    </section>
  );
}
