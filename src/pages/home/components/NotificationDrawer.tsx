import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuthSession } from '@/hooks/useAuthSession';
import { mapleSqlApi, type MapleNotification } from '@/services/mapleSqlApi';
import { useTranslation } from 'react-i18next';

interface Props {
  open: boolean;
  onClose: () => void;
}

const iconForType = (type: string) => {
  if (/comment/i.test(type)) return 'ri-message-2-line';
  if (/guide|like|bookmark/i.test(type)) return 'ri-bookmark-line';
  if (/wiki|proposal/i.test(type)) return 'ri-edit-line';
  return 'ri-notification-3-line';
};

const colorForType = (type: string) => {
  if (/comment/i.test(type)) return 'accent';
  if (/guide|like|bookmark/i.test(type)) return 'primary';
  return 'secondary';
};

const formatWhen = (createdAt: string, locale: string) => {
  const date = new Date(createdAt);
  if (!Number.isFinite(date.getTime())) return '';
  try {
    return new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  }
};

const announceNotificationChange = () => {
  window.dispatchEvent(new Event('maplehub-notifications-changed'));
};

export default function NotificationDrawer({ open, onClose }: Props) {
  const { t, i18n } = useTranslation();
  const { isSessionResolved, isSignedIn } = useAuthSession();
  const [items, setItems] = useState<MapleNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open || !isSignedIn) {
      if (!isSignedIn) setItems([]);
      return;
    }

    setLoading(true);
    setError('');
    void mapleSqlApi.notifications
      .list()
      .then((notifications) => setItems(Array.isArray(notifications) ? notifications : []))
      .catch(() => {
        setError('notifications_load_error');
      })
      .finally(() => setLoading(false));
  }, [isSignedIn, open]);

  const unreadCount = useMemo(
    () => items.filter((item) => !item.read_at).length,
    [items],
  );

  const markAllRead = async () => {
    if (!isSignedIn || items.length === 0) return;
    try {
      await mapleSqlApi.notifications.markAllRead();
      setItems((current) => current.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString() })));
      announceNotificationChange();
    } catch {
      setError('notifications_update_error');
    }
  };

  const markRead = async (id: string) => {
    if (!isSignedIn) return;
    try {
      await mapleSqlApi.notifications.markRead(id);
      setItems((current) => current.map((item) => (item.id === id ? { ...item, read_at: item.read_at || new Date().toISOString() } : item)));
      announceNotificationChange();
    } catch {
      setError('notifications_update_error');
    }
  };

  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      const el = drawerRef.current?.querySelector<HTMLElement>(
        'button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      el?.focus();
    }, 0);
    return () => clearTimeout(timer);
  }, [open]);

  if (!open) return null;
  return (
    <div ref={drawerRef} className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="notification-drawer-title">
      <div
        className="absolute inset-0 bg-foreground-950/40"
        onClick={onClose}
      ></div>
      <aside className="absolute right-0 top-0 h-full w-full max-w-sm bg-background-50 border-l border-background-200 flex flex-col">
        <div className="px-5 py-4 border-b border-background-200 flex items-center justify-between">
          <div>
            <h3 id="notification-drawer-title" className="font-heading font-semibold text-foreground-950">{t('notifications_title')}</h3>
            <p className="text-xs text-foreground-600" aria-live="polite">{t('notifications_unread', { count: unreadCount })}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-background-100 hover:bg-primary-50 flex items-center justify-center cursor-pointer"
            aria-label={t('notifications_close')}
          >
            <i className="ri-close-line text-foreground-700"></i>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {!isSessionResolved && (
            <div className="h-20 rounded-lg bg-background-100" aria-busy="true" />
          )}
          {isSessionResolved && !isSignedIn && (
            <div className="p-4 rounded-lg border border-background-200 bg-background-100 text-sm text-foreground-700">
              {t('notifications_sign_in')}
            </div>
          )}
          {loading && (
            <div
              className="flex items-center gap-2 p-4 rounded-lg border border-background-200 bg-background-100 text-sm text-foreground-700"
              role="status"
              aria-live="polite"
            >
              <i className="ri-loader-4-line animate-spin" aria-hidden="true"></i>
              {t('notifications_loading')}
            </div>
          )}
          {error && (
            <div className="p-4 rounded-lg border border-primary-200 bg-primary-50 text-sm text-primary-700">
              {t(error)}
            </div>
          )}
          {!loading && isSignedIn && items.length === 0 && !error && (
            <div className="p-4 rounded-lg border border-background-200 bg-background-100 text-sm text-foreground-700">
              {t('notifications_empty')}
            </div>
          )}
          {items.map((notification) => {
            const color = colorForType(notification.type);
            return (
              <button
                key={notification.id}
                onClick={() => void markRead(notification.id)}
                className={`w-full p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                  notification.read_at
                    ? 'border-background-200 bg-background-50 hover:bg-background-100'
                    : 'border-primary-200 bg-primary-50/40 hover:bg-primary-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      color === 'primary'
                        ? 'bg-primary-100 text-primary-700'
                        : color === 'accent'
                        ? 'bg-accent-100 text-accent-700'
                        : 'bg-secondary-100 text-secondary-800'
                    }`}
                  >
                    <i className={iconForType(notification.type)}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground-900">{notification.title}</p>
                    <p className="text-sm text-foreground-700 mt-1">{notification.body}</p>
                    <p className="text-[11px] text-foreground-500 mt-1">{formatWhen(notification.created_at, i18n.language)}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <div className="p-4 border-t border-background-200 flex gap-2">
          <button
            onClick={() => void markAllRead()}
            className="flex-1 h-10 rounded-md bg-background-100 hover:bg-background-200 text-sm font-medium text-foreground-800 cursor-pointer whitespace-nowrap"
          >
            {t('notifications_mark_all_read')}
          </button>
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-md bg-primary-500 hover:bg-primary-600 text-background-50 dark:text-foreground-950 text-sm font-semibold cursor-pointer whitespace-nowrap"
          >
            {t('notifications_close')}
          </button>
        </div>
      </aside>
    </div>
  );
}
