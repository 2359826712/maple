import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Footer from '@/pages/home/components/Footer';
import Navbar from '@/pages/home/components/Navbar';
import NotificationDrawer from '@/pages/home/components/NotificationDrawer';
import { shopProducts } from './products';

export default function ShopPage() {
  const { t } = useTranslation();
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background-100 text-foreground-950">
      <Navbar onOpenNotifications={() => setNotifOpen(true)} unread={0} />
      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />

      <main id="main-content" tabIndex={-1} className="pb-16 pt-24 md:pt-28">
        <div className="mx-auto max-w-4xl px-4 md:px-8">
          <header className="border-b border-background-300 pb-7">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-2xl text-white shadow-sm">
                <i className="ri-shopping-bag-3-fill" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">{t('shop_eyebrow')}</p>
                <h1 className="mt-1 font-heading text-3xl font-semibold md:text-4xl">{t('shop_title')}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground-600 md:text-base">{t('shop_desc')}</p>
              </div>
            </div>
          </header>

          <section className="mt-7" aria-labelledby="shop-categories-title">
            <div className="mb-3 flex items-center justify-between gap-4">
              <h2 id="shop-categories-title" className="text-sm font-semibold text-foreground-700">{t('shop_categories')}</h2>
              <span className="text-xs text-foreground-500">{t('shop_external_badge')}</span>
            </div>

            <div className="space-y-3">
              {shopProducts.map((product) => (
                <a
                  key={product.href}
                  href={product.href}
                  target="_blank"
                  rel="sponsored nofollow noopener noreferrer"
                  className="group flex min-h-16 items-center gap-4 rounded-lg border border-background-300 bg-background-50 px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:border-primary-400 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xl ${product.iconClass}`}>
                    <i className={product.icon} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1 font-heading text-sm font-semibold text-foreground-950 sm:text-base">
                    {product.name}
                  </span>
                  <i className="ri-external-link-line shrink-0 text-lg text-foreground-400 transition group-hover:text-primary-700" aria-hidden="true" />
                  <span className="sr-only">{t('shop_open_external')}</span>
                </a>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
