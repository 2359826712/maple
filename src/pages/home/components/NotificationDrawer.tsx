import { notifications } from '@/mocks/home';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function NotificationDrawer({ open, onClose }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-foreground-950/40"
        onClick={onClose}
      ></div>
      <aside className="absolute right-0 top-0 h-full w-full max-w-sm bg-background-50 border-l border-background-200 flex flex-col">
        <div className="px-5 py-4 border-b border-background-200 flex items-center justify-between">
          <div>
            <h3 className="font-heading font-semibold text-foreground-950">Notifications</h3>
            <p className="text-xs text-foreground-600">{notifications.length} new updates for you</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-background-100 hover:bg-primary-50 flex items-center justify-center cursor-pointer"
            aria-label="close"
          >
            <i className="ri-close-line text-foreground-700"></i>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="p-3 rounded-lg border border-background-200 bg-background-50 hover:bg-background-100 transition-colors cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center ${
                    n.color === 'primary'
                      ? 'bg-primary-100 text-primary-700'
                      : n.color === 'accent'
                      ? 'bg-accent-100 text-accent-700'
                      : 'bg-secondary-100 text-secondary-800'
                  }`}
                >
                  <i className={n.icon}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground-900">{n.text}</p>
                  <p className="text-[11px] text-foreground-500 mt-1">{n.when}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-background-200 flex gap-2">
          <button className="flex-1 h-10 rounded-md bg-background-100 hover:bg-background-200 text-sm font-medium text-foreground-800 cursor-pointer whitespace-nowrap">
            Mark all read
          </button>
          <button className="flex-1 h-10 rounded-md bg-primary-500 hover:bg-primary-600 text-background-50 dark:text-foreground-950 text-sm font-semibold cursor-pointer whitespace-nowrap">
            Notification settings
          </button>
        </div>
      </aside>
    </div>
  );
}