import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

interface ImportPreviewData {
  characterCount: number;
  checklistCount: number;
  exportedAt: string;
  preferenceCount: number;
}

interface ImportConfirmDialogProps {
  open: boolean;
  preview: ImportPreviewData | null;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ImportConfirmDialog({
  open,
  preview,
  error,
  onConfirm,
  onCancel,
}: ImportConfirmDialogProps) {
  const { t } = useTranslation();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onEscape = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, [open, onCancel]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      const el = dialogRef.current?.querySelector<HTMLElement>(
        'button, [tabindex]:not([tabindex="-1"])',
      );
      el?.focus();
    }, 0);
    return () => clearTimeout(timer);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground-950/40">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-confirm-dialog-title"
        className="mx-4 w-full max-w-md rounded-lg border border-background-300 bg-white p-6"
      >
        <h2
          id="import-confirm-dialog-title"
          className="text-lg font-semibold text-foreground-950"
        >
          {t('import_dialog_title', 'Import backup')}
        </h2>

        {error ? (
          <div className="mt-4">
            <p className="text-sm text-red-700">
              <i className="ri-error-warning-line mr-1"></i>
              {error}
            </p>
            <button
              type="button"
              onClick={onCancel}
              className="mt-4 h-10 w-full rounded-md bg-background-100 text-sm font-semibold text-foreground-950 hover:bg-background-200"
            >
              {t('import_dialog_close', 'Close')}
            </button>
          </div>
        ) : preview ? (
          <>
            <p className="mt-2 text-sm text-foreground-600">
              {t('import_dialog_desc', 'This will replace your current data with the backup contents.')}
            </p>

            <dl className="mt-4 space-y-2 rounded border border-background-100 bg-background-50 p-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-foreground-600">{t('import_dialog_characters', 'Characters')}</dt>
                <dd className="font-semibold text-foreground-950">{preview.characterCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-foreground-600">{t('import_dialog_checklists', 'Checklists')}</dt>
                <dd className="font-semibold text-foreground-950">{preview.checklistCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-foreground-600">{t('import_dialog_preferences', 'Preferences')}</dt>
                <dd className="font-semibold text-foreground-950">{preview.preferenceCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-foreground-600">{t('import_dialog_exported', 'Exported')}</dt>
                <dd className="font-semibold text-foreground-950">{preview.exportedAt.slice(0, 10)}</dd>
              </div>
            </dl>

            <p className="mt-3 text-xs text-amber-700">
              <i className="ri-alert-line mr-1"></i>
              {t('import_dialog_warning', 'Your current characters and checklists will be replaced.')}
            </p>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="h-10 flex-1 rounded-md border border-background-300 bg-white text-sm font-semibold text-foreground-950 hover:bg-background-50"
              >
                {t('import_dialog_cancel', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="h-10 flex-1 rounded-md bg-primary-500 text-sm font-semibold text-white hover:bg-primary-600"
              >
                {t('import_dialog_confirm', 'Import')}
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
