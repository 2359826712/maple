import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '@/pages/home/components/Navbar';
import Footer from '@/pages/home/components/Footer';
import NotificationDrawer from '@/pages/home/components/NotificationDrawer';
import ErrorBoundary from '@/components/base/ErrorBoundary';
import { bosses, type BossInfo } from '@/mocks/bosses';
import { useCharacters, type CharacterProfile } from '@/hooks/useCharacters';
import { useVersion } from '@/hooks/VersionContext';
import { isAvailableInVersion, millisecondsUntilReset } from '@/domain/regionModel';
import CharacterSwitcher from './CharacterSwitcher';
import CharacterFormDialog from './CharacterFormDialog';
import BossInfoPopup from './BossInfoPopup';
import ImportConfirmDialog from './ImportConfirmDialog';
import DeleteDataDialog from './DeleteDataDialog';
import ResetConfirmDialog from './ResetConfirmDialog';
import FirstRunSetup, { type FirstRunSetupValue } from './FirstRunSetup';
import ChecklistEmptyState, { type ChecklistEmptyReason } from './ChecklistEmptyState';
import { parseMapleHubImport } from '@/hooks/useCharacters';
import { usePeriodReset } from '@/hooks/usePeriodReset';
import { clearResetState } from '@/domain/checklistReset';
import { telemetry } from '@/services/telemetry';
import { eligibleTasksForLevel } from '@/domain/checklistEligibility';
import {
  checklistTaskId,
  getBossChecklistRules,
  getTrackedDifficulty,
  normalizeTrackedDifficulties,
  setTrackedDifficulty,
  type BossDifficultyChecklistRule,
} from '@/domain/bossChecklistRules';
import ChecklistBossRow from './ChecklistBossRow';

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const h = Math.floor(ms / 3600_000);
  const m = Math.floor((ms % 3600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function ChecklistPage() {
  const { t } = useTranslation();
  const { version, setVersion } = useVersion();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [filter, setFilter] = useState<'all' | 'daily' | 'weekly'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditingChecklist, setIsEditingChecklist] = useState(false);
  const [showIneligible, setShowIneligible] = useState(false);
  const [compact, setCompact] = useState(() => {
    try { return localStorage.getItem('maplehub-checklist-density') === 'compact'; } catch { return false; }
  });
  const [undoAction, setUndoAction] = useState<{
    bossId: string;
    difficulty: string;
    previous: number;
    bossName: string;
  } | null>(null);

  // Character management
  const {
    characters,
    activeCharacter,
    activeCharId,
    setActiveCharId,
    tasks,
    setTasks,
    checklistConfig,
    addCharacter,
    updateCharacter,
    deleteCharacter,
    toggleBoss,
    resetTasks,
    replaceTaskSelection,
    exportData,
    importData,
    deleteLocalData,
    isLoggedIn,
    saveError,
    lastSaved,
  } = useCharacters();

  // Character form dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editingChar, setEditingChar] = useState<CharacterProfile | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [transferStatus, setTransferStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<{
    characterCount: number;
    checklistCount: number;
    exportedAt: string;
    preferenceCount: number;
  } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const pendingImportTextRef = useRef<string | null>(null);
  const checklistOpenTrackedRef = useRef(false);
  const lastTrackedSaveRef = useRef<number | null>(null);
  const lastTrackedErrorRef = useRef<string | null>(null);

  // Boss info popup state
  const [popupBoss, setPopupBoss] = useState<BossInfo | null>(null);
  const [popupAnchor, setPopupAnchor] = useState<HTMLElement | null>(null);

  // DAILY-04: Period-based automatic reset
  const { lastResetAt } = usePeriodReset({
    charId: activeCharId,
    version,
    bosses,
    tasks,
    setTasks,
  });

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (checklistOpenTrackedRef.current) return;
    checklistOpenTrackedRef.current = true;
    telemetry.trackChecklistOpen(version, Boolean(activeCharacter));
  }, [activeCharacter, version]);

  useEffect(() => {
    if (saveError && saveError !== lastTrackedErrorRef.current) {
      telemetry.trackChecklistSave('failure');
      lastTrackedErrorRef.current = saveError;
    }
    if (!saveError) lastTrackedErrorRef.current = null;
  }, [saveError]);

  useEffect(() => {
    if (lastSaved && lastSaved !== lastTrackedSaveRef.current) {
      telemetry.trackChecklistSave('success');
      lastTrackedSaveRef.current = lastSaved;
    }
  }, [lastSaved]);

  const handleResetTasks = useCallback(() => {
    setResetConfirmOpen(true);
  }, []);

  const handleConfirmReset = useCallback(() => {
    resetTasks();
    if (activeCharId) clearResetState(activeCharId);
    telemetry.trackChecklistReset();
    setResetConfirmOpen(false);
  }, [resetTasks, activeCharId]);

  const handleToggleBoss = useCallback((boss: BossInfo, rule: BossDifficultyChecklistRule, current: number) => {
    setUndoAction({ bossId: boss.id, difficulty: rule.difficulty, previous: current, bossName: boss.name });
    toggleBoss(boss.id, rule.difficulty, rule.clearLimit);
    const next = current >= rule.clearLimit ? 0 : current + 1;
    telemetry.trackChecklistToggle(rule.period, next >= rule.clearLimit);
  }, [toggleBoss]);

  useEffect(() => {
    if (!undoAction) return;
    const timer = window.setTimeout(() => setUndoAction(null), 3000);
    return () => window.clearTimeout(timer);
  }, [undoAction]);

  const handleUndo = useCallback(() => {
    if (!undoAction) return;
    setTasks((current) => ({
      ...current,
      [undoAction.bossId]: {
        ...current[undoAction.bossId],
        [undoAction.difficulty]: undoAction.previous,
      },
    }));
    setUndoAction(null);
  }, [setTasks, undoAction]);

  const toggleDensity = useCallback(() => {
    setCompact((current) => {
      const next = !current;
      try { localStorage.setItem('maplehub-checklist-density', next ? 'compact' : 'comfortable'); } catch { /* preference remains in memory */ }
      return next;
    });
  }, []);

  const handleOpenAddChar = useCallback(() => {
    setEditingChar(null);
    setFormOpen(true);
  }, []);

  const handleOpenEditChar = useCallback((char: CharacterProfile) => {
    setEditingChar(char);
    setFormOpen(true);
  }, []);

  const handleSaveChar = useCallback((input: Omit<CharacterProfile, 'id' | 'isDefault'>) => {
    if (editingChar) {
      updateCharacter(editingChar.id, input);
    } else {
      addCharacter(input);
    }
  }, [editingChar, updateCharacter, addCharacter]);

  const handleBossNameClick = useCallback((boss: BossInfo, e: React.MouseEvent) => {
    setPopupBoss(boss);
    setPopupAnchor(e.currentTarget as HTMLElement);
  }, []);

  const handleExport = useCallback(() => {
    const blob = new Blob([exportData()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `maplehub-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setTransferStatus({ ok: true, text: t('checklist_export_success') });
  }, [exportData, t]);

  const handleImportFile = useCallback(async (file: File | undefined) => {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseMapleHubImport(text);
      if ('reason' in parsed) {
        const reasons: Record<string, string> = {
          'too-large': t('import_error_too_large', 'File is too large (max 5 MB).'),
          'invalid-json': t('import_error_invalid_json', 'The file is not valid JSON.'),
          'invalid-schema': t('import_error_invalid_schema', 'The file is not a valid MapleHub backup.'),
        };
        setImportError(reasons[parsed.reason] || t('checklist_import_error'));
        setImportPreview(null);
        setImportDialogOpen(true);
        return;
      }
      pendingImportTextRef.current = text;
      setImportPreview({
        characterCount: parsed.envelope.characters.length,
        checklistCount: Object.keys(parsed.envelope.checklists).length,
        exportedAt: parsed.envelope.exportedAt,
        preferenceCount: Object.keys(parsed.envelope.preferences).length,
      });
      setImportError(null);
      setImportDialogOpen(true);
    } catch {
      setImportError(t('checklist_import_error'));
      setImportPreview(null);
      setImportDialogOpen(true);
    } finally {
      if (importInputRef.current) importInputRef.current.value = '';
    }
  }, [t]);

  const handleImportConfirm = useCallback(() => {
    if (!pendingImportTextRef.current) return;
    try {
      const result = importData(pendingImportTextRef.current);
      setTransferStatus({ ok: result.ok, text: t(result.ok ? 'checklist_import_success' : 'checklist_import_error') });
    } catch {
      setTransferStatus({ ok: false, text: t('checklist_import_error') });
    } finally {
      pendingImportTextRef.current = null;
      setImportDialogOpen(false);
      setImportPreview(null);
    }
  }, [importData, t]);

  const handleImportCancel = useCallback(() => {
    pendingImportTextRef.current = null;
    setImportDialogOpen(false);
    setImportPreview(null);
    setImportError(null);
  }, []);

  const handleDeleteLocalData = useCallback(() => {
    deleteLocalData();
    setDeleteDialogOpen(false);
    setTransferStatus({ ok: true, text: t('checklist_delete_data_success') });
  }, [deleteLocalData, t]);

  const handleFirstRunSetup = useCallback((value: FirstRunSetupValue) => {
    setTransferStatus(null);
    setVersion(value.version);
    addCharacter({
      name: value.name,
      level: value.level,
      server: value.version.toUpperCase(),
      className: '',
      world: '',
    });
  }, [addCharacter, setVersion]);

  const dailyCountdown = millisecondsUntilReset('daily', version, now);
  const weeklyCountdown = millisecondsUntilReset('weekly', version, now);
  const formatExactReset = useCallback((countdown: number) => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || t('checklist_local_timezone');
    return t('checklist_reset_exact', {
      date: new Date(now + countdown).toLocaleString(),
      timezone,
    });
  }, [now, t]);

  const regionBosses = useMemo(
    () => bosses.filter((boss) => isAvailableInVersion(boss.regions, version)),
    [version],
  );
  const eligibleBosses = useMemo(
    () => eligibleTasksForLevel(regionBosses, activeCharacter?.level ?? 0),
    [activeCharacter?.level, regionBosses],
  );
  const rulesByBossId = useMemo(
    () => new Map(regionBosses.map((boss) => [boss.id, getBossChecklistRules(boss, version)])),
    [regionBosses, version],
  );
  const defaultSelectedTaskIds = useMemo(() => eligibleBosses.flatMap((boss) => {
    const rule = rulesByBossId.get(boss.id)?.at(-1);
    return rule ? [checklistTaskId(boss.id, rule.difficulty)] : [];
  }), [eligibleBosses, rulesByBossId]);
  const rawSelectedTaskIds = checklistConfig?.selectedTaskIds ?? defaultSelectedTaskIds;
  const normalizedSelectedTaskIds = useMemo(
    () => normalizeTrackedDifficulties(regionBosses, rawSelectedTaskIds),
    [rawSelectedTaskIds, regionBosses],
  );
  const selectedTaskIds = useMemo(
    () => new Set(normalizedSelectedTaskIds),
    [normalizedSelectedTaskIds],
  );

  useEffect(() => {
    if (!checklistConfig) return;
    const current = [...checklistConfig.selectedTaskIds].sort();
    if (current.join('\u0000') !== normalizedSelectedTaskIds.join('\u0000')) {
      replaceTaskSelection(normalizedSelectedTaskIds);
    }
  }, [checklistConfig, normalizedSelectedTaskIds, replaceTaskSelection]);

  const handleTrackedDifficulty = useCallback((bossId: string, difficulty: string | null) => {
    replaceTaskSelection(setTrackedDifficulty(normalizedSelectedTaskIds, bossId, difficulty));
  }, [normalizedSelectedTaskIds, replaceTaskSelection]);

  const applyChecklistPreset = useCallback((period: 'all' | 'daily' | 'weekly') => {
    const next = eligibleBosses.flatMap((boss) => {
      const rules = rulesByBossId.get(boss.id) ?? [];
      const candidates = period === 'all' ? rules : rules.filter((rule) => rule.period === period);
      const rule = candidates.at(-1);
      return rule ? [checklistTaskId(boss.id, rule.difficulty)] : [];
    });
    replaceTaskSelection(next.sort());
  }, [eligibleBosses, replaceTaskSelection, rulesByBossId]);

  type BossRow = {
    boss: BossInfo;
    rules: BossDifficultyChecklistRule[];
    trackedRule: BossDifficultyChecklistRule | null;
    eligible: boolean;
  };

  const filteredBosses = useMemo<BossRow[]>(() => {
    const eligibleIds = new Set(eligibleBosses.map((boss) => boss.id));
    const source = isEditingChecklist ? regionBosses : eligibleBosses;
    const query = searchQuery.trim().toLowerCase();
    const list = source.flatMap((boss) => {
      const rules = rulesByBossId.get(boss.id) ?? [];
      const trackedDifficulty = getTrackedDifficulty(boss, selectedTaskIds);
      const trackedRule = rules.find((rule) => rule.difficulty === trackedDifficulty) ?? null;
      const eligible = eligibleIds.has(boss.id);
      if (!isEditingChecklist && !trackedRule) return [];
      if (isEditingChecklist && !showIneligible && !eligible) return [];
      if (filter !== 'all') {
        const matchesPeriod = isEditingChecklist
          ? rules.some((rule) => rule.period === filter)
          : trackedRule?.period === filter;
        if (!matchesPeriod) return [];
      }
      if (query && !boss.name.toLowerCase().includes(query) && !boss.nameZh.includes(query)) return [];
      return [{ boss, rules, trackedRule, eligible }];
    });

    if (isEditingChecklist) return list;
    return [...list].sort((a, b) => {
      const doneA = a.trackedRule
        ? Math.min(tasks[a.boss.id]?.[a.trackedRule.difficulty] ?? 0, a.trackedRule.clearLimit) >= a.trackedRule.clearLimit ? 1 : 0
        : 0;
      const doneB = b.trackedRule
        ? Math.min(tasks[b.boss.id]?.[b.trackedRule.difficulty] ?? 0, b.trackedRule.clearLimit) >= b.trackedRule.clearLimit ? 1 : 0
        : 0;
      return doneA - doneB;
    });
  }, [eligibleBosses, filter, isEditingChecklist, regionBosses, rulesByBossId, searchQuery, selectedTaskIds, showIneligible, tasks]);

  const isGroupedView = filter === 'all' && !isEditingChecklist;
  const dailyGroupRows = useMemo(
    () => filteredBosses.filter((row) => row.trackedRule?.period === 'daily'),
    [filteredBosses],
  );
  const weeklyGroupRows = useMemo(
    () => filteredBosses.filter((row) => row.trackedRule?.period === 'weekly'),
    [filteredBosses],
  );

  const selectedRows = useMemo(() => eligibleBosses.flatMap((boss) => {
    const rules = rulesByBossId.get(boss.id) ?? [];
    const trackedDifficulty = getTrackedDifficulty(boss, selectedTaskIds);
    const rule = rules.find((candidate) => candidate.difficulty === trackedDifficulty);
    return rule ? [{ boss, rule }] : [];
  }), [eligibleBosses, rulesByBossId, selectedTaskIds]);
  const selectedDailyRows = selectedRows.filter(({ rule }) => rule.period === 'daily');
  const selectedWeeklyRows = selectedRows.filter(({ rule }) => rule.period === 'weekly');

  const totalDaily = selectedDailyRows.reduce((sum, { rule }) => sum + rule.clearLimit, 0);
  const doneDaily = selectedDailyRows.reduce(
    (sum, { boss, rule }) => sum + Math.min(tasks[boss.id]?.[rule.difficulty] ?? 0, rule.clearLimit),
    0,
  );
  const totalWeekly = selectedWeeklyRows.reduce((sum, { rule }) => sum + rule.clearLimit, 0);
  const doneWeekly = selectedWeeklyRows.reduce(
    (sum, { boss, rule }) => sum + Math.min(tasks[boss.id]?.[rule.difficulty] ?? 0, rule.clearLimit),
    0,
  );

  const emptyStateReason = useMemo<ChecklistEmptyReason | null>(() => {
    if (filteredBosses.length > 0) return null;
    if (searchQuery.trim()) return 'search';
    if (isEditingChecklist) return 'filter';

    const eligibleTaskCount = eligibleBosses.length;
    if (eligibleTaskCount === 0) return 'no-eligible';
    if (selectedDailyRows.length + selectedWeeklyRows.length === 0) return 'no-selected';
    return 'filter';
  }, [eligibleBosses.length, filteredBosses.length, isEditingChecklist, searchQuery, selectedDailyRows.length, selectedWeeklyRows.length]);

  const activeFilterLabel = filter === 'daily'
    ? t('checklist_filter_daily')
    : filter === 'weekly'
      ? t('checklist_filter_weekly')
      : t('checklist_filter_all');
  const isPrimaryEmptyState = emptyStateReason === 'no-eligible' || emptyStateReason === 'no-selected';
  const emptyStateContent = emptyStateReason ? (
    <ChecklistEmptyState
      reason={emptyStateReason}
      characterLevel={activeCharacter?.level ?? 1}
      query={searchQuery.trim()}
      filterLabel={activeFilterLabel}
      onEdit={() => {
        setSearchQuery('');
        setFilter('all');
        setIsEditingChecklist(true);
      }}
      onClearSearch={() => setSearchQuery('')}
      onShowAll={() => setFilter('all')}
    />
  ) : null;

  return (
    <div className="min-h-screen bg-background-50 text-foreground-950">
      <Navbar onOpenNotifications={() => setNotifOpen(true)} unread={0} />
      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />

      <main id="main-content" tabIndex={-1} className="pt-16 md:pt-20">
        <ErrorBoundary
          fallback={(error, reset) => (
            <div className="mx-auto max-w-6xl px-4 py-16 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
                <i className="ri-error-warning-line text-2xl" />
              </div>
              <h2 className="font-heading text-xl font-semibold text-foreground-950">
                {t('checklist_error_title')}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-foreground-600">
                {t('checklist_error_desc')}
              </p>
              <p className="mt-1 text-xs text-foreground-500">{error.message}</p>
              <button
                type="button"
                onClick={reset}
                className="mt-4 h-10 rounded-full bg-primary-500 px-5 text-sm font-semibold text-background-50 hover:bg-primary-600 cursor-pointer"
              >
                {t('checklist_retry')}
              </button>
            </div>
          )}
        >
        {characters.length === 0 ? (
          <FirstRunSetup initialVersion={version} onComplete={handleFirstRunSetup} />
        ) : (
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-8">
          {/* Character Switcher */}
          <CharacterSwitcher
            characters={characters}
            activeCharId={activeCharId}
            onSelect={setActiveCharId}
            onAdd={handleOpenAddChar}
            onEdit={handleOpenEditChar}
            onDelete={deleteCharacter}
          />

          {/* Header */}
          <div className="mb-6">
            <h1 className="font-serif text-2xl font-normal md:text-3xl">
              {t('checklist_title')}
              {activeCharacter && (
                <span className="ml-2 text-lg text-foreground-600">
                  — {activeCharacter.name}
                </span>
              )}
            </h1>
            <p className="mt-1 text-sm text-foreground-600">
              {t('checklist_desc')}
            </p>
            {/* Save status indicator */}
            <div aria-live="polite" role="status">
              {saveError ? (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600">
                  <i className="ri-error-warning-line"></i>
                  {saveError}
                </div>
              ) : (
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground-600">
                  <span className="flex items-center gap-1.5 text-green-700">
                    <i className="ri-check-line"></i>
                    {lastSaved ? t('checklist_auto_saved') : t('checklist_saved_locally')}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <i className="ri-device-line"></i>
                    {t(isLoggedIn ? 'checklist_storage_local_signed_in' : 'checklist_storage_local')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {isPrimaryEmptyState ? emptyStateContent : (<>
          {/* Progress cards */}
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            {/* Daily progress */}
            <div className="border border-background-300 bg-white p-4">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground-950">
                  {t('checklist_daily')}
                </span>
                <span className="text-xs text-foreground-600">
                  {totalDaily ? `${doneDaily}/${totalDaily}` : '—'}
                </span>
              </div>
              <div className="mb-2 h-2 rounded-full bg-background-100">
                <div
                  className="h-full rounded-full bg-primary-600 transition-all"
                  style={{ width: `${totalDaily ? (doneDaily / totalDaily) * 100 : 0}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-foreground-600">
                <span>{totalDaily ? `${Math.round((doneDaily / totalDaily) * 100)}%` : t('checklist_progress_empty')}</span>
                <span
                  className="font-medium text-primary-700"
                  title={formatExactReset(dailyCountdown)}
                >
                  {t('checklist_daily_reset_in', { time: formatCountdown(dailyCountdown) })}
                </span>
              </div>
            </div>

            {/* Weekly progress */}
            <div className="border border-background-300 bg-white p-4">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground-950">
                  {t('checklist_weekly')}
                </span>
                <span className="text-xs text-foreground-600">
                  {totalWeekly ? `${doneWeekly}/${totalWeekly}` : '—'}
                </span>
              </div>
              <div className="mb-2 h-2 rounded-full bg-background-100">
                <div
                  className="h-full rounded-full bg-red-600 transition-all"
                  style={{ width: `${totalWeekly ? (doneWeekly / totalWeekly) * 100 : 0}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-foreground-600">
                <span>{totalWeekly ? `${Math.round((doneWeekly / totalWeekly) * 100)}%` : t('checklist_progress_empty')}</span>
                <span
                  className="font-medium text-red-700"
                  title={formatExactReset(weeklyCountdown)}
                >
                  {t('checklist_weekly_reset_in', { time: formatCountdown(weeklyCountdown) })}
                </span>
              </div>
            </div>

            {/* Quick actions */}
            <div className="border border-background-300 bg-white p-4">
              <div className="mb-2 flex items-center justify-between text-sm font-semibold text-foreground-950">
                <span>{t('checklist_quick_actions')}</span>
                {lastResetAt && (
                  <span className="text-xs font-normal text-foreground-600">
                    {t('checklist_last_reset', {
                      time: new Date(lastResetAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      }),
                    })}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleResetTasks}
                  className="rounded border border-background-300 bg-background-50 px-3 py-1.5 text-xs hover:bg-background-100"
                >
                  {t('checklist_reset_all')}
                </button>
                <Link
                  to="/wiki/boss"
                  className="rounded border border-background-300 bg-background-50 px-3 py-1.5 text-xs text-primary-600 hover:bg-background-100"
                >
                  {t('checklist_boss_guides')}
                </Link>
                <Link
                  to="/guides/level"
                  className="rounded border border-background-300 bg-background-50 px-3 py-1.5 text-xs text-primary-600 hover:bg-background-100"
                >
                  {t('checklist_level_guide')}
                </Link>
                <button
                  type="button"
                  onClick={handleExport}
                  className="rounded border border-background-300 bg-background-50 px-3 py-1.5 text-xs text-primary-600 hover:bg-background-100"
                >
                  {t('checklist_export_data')}
                </button>
                <button
                  type="button"
                  onClick={() => importInputRef.current?.click()}
                  className="rounded border border-background-300 bg-background-50 px-3 py-1.5 text-xs text-primary-600 hover:bg-background-100"
                >
                  {t('checklist_import_data')}
                </button>
                <input
                  ref={importInputRef}
                  type="file"
                  accept="application/json,.json"
                  className="sr-only"
                  aria-hidden="true"
                  tabIndex={-1}
                  onChange={(event) => void handleImportFile(event.target.files?.[0])}
                />
                <button
                  type="button"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="rounded border border-red-300 bg-white px-3 py-1.5 text-xs text-red-700 hover:bg-red-50"
                >
                  {t('checklist_delete_data')}
                </button>
              </div>
              {transferStatus && (
                <p
                  className={`mt-2 text-xs ${transferStatus.ok ? 'text-green-700' : 'text-red-700'}`}
                  role="status"
                  aria-live="polite"
                >
                  {transferStatus.text}
                </p>
              )}
            </div>
          </div>

          {/* Filter + Search */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              {(['all', 'daily', 'weekly'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`rounded px-3 py-1.5 text-sm ${
                    filter === f
                      ? 'bg-primary-600 text-white'
                      : 'border border-background-300 bg-white text-foreground-950 hover:bg-background-100'
                  }`}
                >
                  {f === 'all'
                    ? t('checklist_filter_all')
                    : f === 'daily'
                    ? t('checklist_filter_daily')
                    : t('checklist_filter_weekly')}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              {isEditingChecklist && (
                <button
                  type="button"
                  aria-pressed={showIneligible}
                  onClick={() => setShowIneligible((current) => !current)}
                  className="h-11 rounded border border-background-300 bg-white px-3 text-sm font-medium text-foreground-700 hover:bg-background-100"
                >
                  {showIneligible ? t('checklist_hide_ineligible') : t('checklist_show_ineligible')}
                </button>
              )}
              <button
                type="button"
                aria-pressed={compact}
                onClick={toggleDensity}
                className="h-11 rounded border border-background-300 bg-white px-3 text-sm font-medium text-foreground-700 hover:bg-background-100"
              >
                <i className={`${compact ? 'ri-layout-row-line' : 'ri-list-check-3'} mr-1.5`} aria-hidden="true" />
                {compact ? t('checklist_density_comfortable') : t('checklist_density_compact')}
              </button>
              <button
                type="button"
                aria-pressed={isEditingChecklist}
                onClick={() => setIsEditingChecklist((current) => !current)}
                className="h-11 rounded border border-primary-300 bg-white px-4 text-sm font-semibold text-primary-700 hover:bg-primary-50"
              >
                {isEditingChecklist ? t('checklist_edit_done') : t('checklist_edit')}
              </button>
              <div className="flex h-11 items-center border border-background-300 bg-white sm:w-64">
                <i className="ri-search-line px-2 text-foreground-600"></i>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('checklist_search_placeholder')}
                  className="h-full min-w-0 flex-1 bg-transparent px-1 text-sm outline-none"
                />
              </div>
            </div>
          </div>

          {isEditingChecklist ? (
            <div className="mb-3 rounded-lg border border-primary-200 bg-primary-50 px-4 py-3" role="status" aria-live="polite">
              <div className="flex items-start gap-2">
                <i className="ri-information-line mt-0.5 shrink-0 text-lg text-primary-600" />
                <p className="text-sm font-medium text-primary-800">
                  {t('checklist_edit_help')}
                </p>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-primary-700">
                  {t('checklist_presets')}
                </span>
                <button
                  type="button"
                  onClick={() => applyChecklistPreset('all')}
                  className="min-h-9 rounded-md border border-primary-200 bg-white px-3 text-xs font-semibold text-primary-800 hover:border-primary-400"
                >
                  {t('checklist_preset_main')}
                </button>
                <button
                  type="button"
                  onClick={() => applyChecklistPreset('weekly')}
                  className="min-h-9 rounded-md border border-primary-200 bg-white px-3 text-xs font-semibold text-primary-800 hover:border-primary-400"
                >
                  {t('checklist_preset_weekly')}
                </button>
                <button
                  type="button"
                  onClick={() => applyChecklistPreset('daily')}
                  className="min-h-9 rounded-md border border-primary-200 bg-white px-3 text-xs font-semibold text-primary-800 hover:border-primary-400"
                >
                  {t('checklist_preset_daily')}
                </button>
              </div>
            </div>
          ) : (
            <p className="mb-3 text-sm text-foreground-600" role="status" aria-live="polite">
              {t('checklist_eligible_summary', { count: filteredBosses.length })}
            </p>
          )}

          {emptyStateReason ? (
            emptyStateContent
          ) : (<>
          {/* One responsive row per boss; difficulty controls appear only in edit mode. */}
          <div className={compact ? 'space-y-1.5' : 'space-y-2.5'}>
            {(() => {
              const renderResetHeader = (
                period: 'daily' | 'weekly',
                done: number,
                total: number,
                countdown: number,
              ) => {
                const label = period === 'daily'
                  ? t('checklist_group_today')
                  : t('checklist_group_this_week');
                const resetLabel = period === 'daily'
                  ? t('checklist_daily_reset_in', { time: formatCountdown(countdown) })
                  : t('checklist_weekly_reset_in', { time: formatCountdown(countdown) });
                return (
                  <div
                    key={`header-${period}`}
                    className="rounded-lg border border-primary-100 bg-primary-50 px-3 py-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-foreground-950">{label}</span>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-foreground-600">
                        <span>{t('checklist_group_progress', { done, total })}</span>
                        <span
                          className="font-medium text-primary-700"
                          title={formatExactReset(countdown)}
                        >
                          {resetLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              };

              const renderBossRow = (row: BossRow) => {
                const current = row.trackedRule
                  ? Math.min(
                      tasks[row.boss.id]?.[row.trackedRule.difficulty] ?? 0,
                      row.trackedRule.clearLimit,
                    )
                  : 0;
                return (
                  <ChecklistBossRow
                    key={row.boss.id}
                    boss={row.boss}
                    rules={row.rules}
                    trackedRule={row.trackedRule}
                    current={current}
                    editing={isEditingChecklist}
                    eligible={row.eligible}
                    compact={compact}
                    onSetDifficulty={(difficulty) => handleTrackedDifficulty(row.boss.id, difficulty)}
                    onToggle={(rule, value) => handleToggleBoss(row.boss, rule, value)}
                    onOpenInfo={(event) => handleBossNameClick(row.boss, event)}
                    onViewGuide={() => navigate(`/wiki/boss/${encodeURIComponent(row.boss.name)}`)}
                  />
                );
              };

              if (isGroupedView) {
                return (
                  <>
                    {dailyGroupRows.length > 0 && renderResetHeader('daily', doneDaily, totalDaily, dailyCountdown)}
                    {dailyGroupRows.map(renderBossRow)}
                    {weeklyGroupRows.length > 0 && renderResetHeader('weekly', doneWeekly, totalWeekly, weeklyCountdown)}
                    {weeklyGroupRows.map(renderBossRow)}
                  </>
                );
              }
              return filteredBosses.map(renderBossRow);
            })()}
          </div>
          </>)}
          </>)}
        </div>
        )}
        </ErrorBoundary>
      </main>

      <Footer />

      {/* Character Form Dialog */}
      <CharacterFormDialog
        open={formOpen}
        editing={editingChar}
        onClose={() => setFormOpen(false)}
        onSave={handleSaveChar}
      />

      {/* Boss Info Popup */}
      <BossInfoPopup
        boss={popupBoss}
        anchorEl={popupAnchor}
        onClose={() => { setPopupBoss(null); setPopupAnchor(null); }}
        onViewGuide={(name) => {
          setPopupBoss(null);
          navigate(`/wiki/boss/${encodeURIComponent(name)}`);
        }}
      />

      {/* Import Confirmation Dialog */}
      <ImportConfirmDialog
        open={importDialogOpen}
        preview={importPreview}
        error={importError}
        onConfirm={handleImportConfirm}
        onCancel={handleImportCancel}
      />

      <DeleteDataDialog
        open={deleteDialogOpen}
        onConfirm={handleDeleteLocalData}
        onCancel={() => setDeleteDialogOpen(false)}
      />

      <ResetConfirmDialog
        open={resetConfirmOpen}
        onConfirm={handleConfirmReset}
        onCancel={() => setResetConfirmOpen(false)}
      />

      {undoAction && (
        <div
          className="fixed bottom-4 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-3 rounded-lg border border-primary-200 bg-foreground-950 px-4 py-3 text-sm text-background-50 shadow-xl"
          role="status"
          aria-live="polite"
        >
          <i className="ri-checkbox-circle-line text-primary-300" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate">
            {t('checklist_completion_changed', { boss: undoAction.bossName })}
          </span>
          <button
            type="button"
            onClick={handleUndo}
            className="h-10 shrink-0 rounded-md bg-background-50 px-3 font-semibold text-foreground-950 hover:bg-background-100"
          >
            {t('checklist_undo')}
          </button>
        </div>
      )}
    </div>
  );
}
