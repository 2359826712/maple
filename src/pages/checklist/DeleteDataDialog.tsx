import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface DeleteDataDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteDataDialog({ open, onConfirm, onCancel }: DeleteDataDialogProps) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    const focusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>('button:not([disabled])') || []);
    focusable()[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (items.length === 0) return;
      const current = items.indexOf(document.activeElement as HTMLElement);
      const next = event.shiftKey
        ? (current <= 0 ? items.length - 1 : current - 1)
        : (current >= items.length - 1 ? 0 : current + 1);
      event.preventDefault();
      items[next]?.focus();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground-950/40">
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-data-dialog-title"
        aria-describedby="delete-data-dialog-description"
        className="mx-4 w-full max-w-md rounded-lg border border-background-300 bg-white p-6"
      >
        <h2 id="delete-data-dialog-title" className="text-lg font-semibold text-foreground-950">
          {t('delete_data_dialog_title')}
        </h2>
        <p id="delete-data-dialog-description" className="mt-2 text-sm text-foreground-600">
          {t('delete_data_dialog_description')}
        </p>
        <p className="mt-3 text-xs text-red-700">{t('delete_data_dialog_warning')}</p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-11 flex-1 rounded-md border border-background-300 bg-white text-sm font-semibold text-foreground-950 hover:bg-background-50"
          >
            {t('delete_data_dialog_cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-11 flex-1 rounded-md bg-red-700 text-sm font-semibold text-white hover:bg-red-800"
          >
            {t('delete_data_dialog_confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
