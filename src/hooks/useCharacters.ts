import { useCallback, useEffect, useRef, useState } from 'react';
import { getAccessToken } from '@/hooks/useAuthSession';
import { ACCOUNT_CACHE_CHANGED_EVENT, ACCOUNT_CACHE_OWNER_KEY } from '@/services/accountDataSync';
import { isStaticHydration, scheduleAfterStaticHydration } from '@/ssg/hydration';
import {
  applyStorageTransaction,
  deleteAllPlayerData,
  migrateStorageKey,
  readJson,
  writeJsonWithRecovery,
  writeStorageValueWithRecovery,
} from '@/services/persistentStorage';

export interface CharacterProfile {
  id: string;
  name: string;
  className: string;
  level: number;
  server: string;
  world: string;
  isDefault: boolean;
}

export interface TaskState {
  [bossId: string]: { [difficulty: string]: number };
}

export interface ChecklistConfiguration {
  selectedTaskIds: string[];
  updatedAt: string;
}

const CHARACTERS_KEY = 'maplehub-characters:v2';
const LEGACY_CHARACTERS_KEY = 'maplehub-characters';
const LEGACY_CHECKLIST_KEY = 'maplehub-checklist';
const NEWS_STATE_KEY = 'maplehub-news-state:v1';
const EXPORT_FORMAT = 'maplehub-export';
const EXPORT_VERSION = 3;
const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
const PREFERENCE_KEYS = [
  'maplehub-game-version',
  'maplehub-language',
  'i18nextLng',
  'maplehub-theme',
  'maplehub-color-mode',
  'maplehub-tool-favorites',
  'maplehub-guide-reading-progress:v1',
  'maplehub-routine-tasks:v2',
  'maplehub-event-goals:v2',
  'maplehub-link-planner:v2:gms',
  'maplehub-link-planner:v2:kms',
  'maplehub-link-planner:v2:jms',
  'maplehub-link-planner:v2:tms',
  'maplehub-link-planner:v2:msea',
] as const;
const MAX_FIELD_LENGTH = 200;
const MAX_PREFERENCE_LENGTH = 100_000;
const forbiddenRecordKeys = new Set(['__proto__', 'prototype', 'constructor']);

interface MapleHubExportEnvelope {
  format: typeof EXPORT_FORMAT;
  version: typeof EXPORT_VERSION;
  exportedAt: string;
  characters: CharacterProfile[];
  checklists: Record<string, TaskState>;
  checklistConfigs: Record<string, ChecklistConfiguration>;
  newsState: Record<string, unknown> | null;
  preferences: Record<string, string>;
}

interface MapleHubExportEnvelopeV1 extends Omit<MapleHubExportEnvelope, 'version' | 'checklistConfigs'> {
  version: 1;
}

interface MapleHubExportEnvelopeV2 extends Omit<MapleHubExportEnvelope, 'version'> {
  version: 2;
}

const isCharacterProfile = (value: unknown): value is CharacterProfile => {
  if (!isPlainRecord(value)) return false;
  const allowedKeys = ['id', 'name', 'className', 'level', 'server', 'world', 'isDefault'];
  if (!hasExactKeys(value, allowedKeys)) return false;
  const profile = value as Partial<CharacterProfile>;
  return isBoundedString(profile.id, true)
    && isBoundedString(profile.name, true)
    && isBoundedString(profile.className)
    && Number.isInteger(profile.level) && Number(profile.level) >= 1 && Number(profile.level) <= 999
    && isBoundedString(profile.server)
    && isBoundedString(profile.world)
    && typeof profile.isDefault === 'boolean';
};

const isCharacterList = (value: unknown): value is CharacterProfile[] =>
  Array.isArray(value)
  && value.length <= 1000
  && value.every(isCharacterProfile)
  && new Set(value.map((profile) => profile.id)).size === value.length
  && value.filter((profile) => profile.isDefault).length <= 1;

const isTaskState = (value: unknown): value is TaskState => {
  if (!isPlainRecord(value) || !hasSafeKeys(value)) return false;
  return Object.entries(value).every(([bossId, difficulties]) =>
    isBoundedString(bossId, true)
      && isPlainRecord(difficulties)
      && hasSafeKeys(difficulties)
      && Object.entries(difficulties).every(([difficulty, count]) =>
        isBoundedString(difficulty, true)
        && Number.isInteger(count)
        && Number(count) >= 0
        && Number(count) <= 999,
      ),
  );
};

const isChecklistConfiguration = (value: unknown): value is ChecklistConfiguration =>
  isPlainRecord(value)
  && hasExactKeys(value, ['selectedTaskIds', 'updatedAt'])
  && Array.isArray(value.selectedTaskIds)
  && value.selectedTaskIds.length <= 1000
  && value.selectedTaskIds.every((taskId) => isBoundedString(taskId, true))
  && new Set(value.selectedTaskIds).size === value.selectedTaskIds.length
  && typeof value.updatedAt === 'string'
  && Number.isFinite(Date.parse(value.updatedAt));

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasSafeKeys(value: Record<string, unknown>) {
  return Object.keys(value).every((key) => !forbiddenRecordKeys.has(key));
}

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]) {
  const keys = Object.keys(value);
  return keys.length === expected.length
    && keys.every((key) => expected.includes(key))
    && hasSafeKeys(value);
}

function isBoundedString(value: unknown, required = false): value is string {
  return typeof value === 'string'
    && value.length <= MAX_FIELD_LENGTH
    && (!required || value.trim().length > 0);
}

function isBooleanRecord(value: unknown): value is Record<string, boolean> {
  return isPlainRecord(value)
    && hasSafeKeys(value)
    && Object.entries(value).every(([key, entry]) => isBoundedString(key, true) && typeof entry === 'boolean');
}

function isNewsState(value: unknown): value is { saved: Record<string, boolean>; read: Record<string, boolean> } {
  return isPlainRecord(value)
    && hasExactKeys(value, ['saved', 'read'])
    && isBooleanRecord(value.saved)
    && isBooleanRecord(value.read);
}

function isPreferenceRecord(value: unknown): value is Record<string, string> {
  return isPlainRecord(value)
    && hasSafeKeys(value)
    && Object.entries(value).every(([key, entry]) =>
      PREFERENCE_KEYS.includes(key as (typeof PREFERENCE_KEYS)[number])
      && typeof entry === 'string'
      && entry.length <= MAX_PREFERENCE_LENGTH,
    );
}

const hasValidEnvelopeCore = (value: Record<string, unknown>) => {
  if (value.format !== EXPORT_FORMAT) return false;
  if (typeof value.exportedAt !== 'string' || !Number.isFinite(Date.parse(value.exportedAt))) return false;
  const characters = value.characters;
  const checklists = value.checklists;
  if (!isCharacterList(characters) || !isPlainRecord(checklists) || !hasSafeKeys(checklists)) return false;
  if (!Object.entries(checklists).every(([characterId, checklist]) =>
    characters.some((character) => character.id === characterId) && isTaskState(checklist),
  )) return false;
  if (value.newsState !== null && !isNewsState(value.newsState)) return false;
  return isPreferenceRecord(value.preferences);
};

const isExportEnvelopeWithChecklist = (value: unknown, version: number) => {
  if (!isPlainRecord(value)) return false;
  const allowedKeys = new Set(['format', 'version', 'exportedAt', 'characters', 'checklists', 'checklistConfigs', 'newsState', 'preferences']);
  if (!hasExactKeys(value, [...allowedKeys])) return false;
  if (value.format !== EXPORT_FORMAT || value.version !== version) return false;
  if (!hasValidEnvelopeCore(value)) return false;
  if (!isPlainRecord(value.checklistConfigs) || !hasSafeKeys(value.checklistConfigs)) return false;
  return Object.entries(value.checklistConfigs).every(([characterId, config]) =>
    (value.characters as CharacterProfile[]).some((character) => character.id === characterId)
    && isChecklistConfiguration(config),
  );
};

const isExportEnvelopeV3 = (value: unknown): value is MapleHubExportEnvelope =>
  isExportEnvelopeWithChecklist(value, EXPORT_VERSION);

const isExportEnvelopeV2 = (value: unknown): value is MapleHubExportEnvelopeV2 =>
  isExportEnvelopeWithChecklist(value, 2);

const isExportEnvelopeV1 = (value: unknown): value is MapleHubExportEnvelopeV1 => {
  if (!isPlainRecord(value)) return false;
  const allowedKeys = ['format', 'version', 'exportedAt', 'characters', 'checklists', 'newsState', 'preferences'];
  return hasExactKeys(value, allowedKeys) && value.version === 1 && hasValidEnvelopeCore(value);
};

export function parseMapleHubImport(text: string):
  | { ok: true; envelope: MapleHubExportEnvelope }
  | { ok: false; reason: 'too-large' | 'invalid-json' | 'invalid-schema' } {
  if (new Blob([text]).size > MAX_IMPORT_BYTES) return { ok: false, reason: 'too-large' };
  try {
    const envelope = JSON.parse(text) as unknown;
    if (isExportEnvelopeV3(envelope)) return { ok: true, envelope };
    if (isExportEnvelopeV2(envelope)) return { ok: true, envelope: { ...envelope, version: EXPORT_VERSION } };
    if (isExportEnvelopeV1(envelope)) {
      return { ok: true, envelope: { ...envelope, version: EXPORT_VERSION, checklistConfigs: {} } };
    }
    return { ok: false, reason: 'invalid-schema' };
  } catch {
    return { ok: false, reason: 'invalid-json' };
  }
}

function generateId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function loadLocalCharacters(): CharacterProfile[] {
  try {
    const migration = migrateStorageKey(localStorage, LEGACY_CHARACTERS_KEY, CHARACTERS_KEY, isCharacterList);
    if (migration.status === 'failed') console.warn('[MPStorys] Character migration failed; legacy data was preserved.', migration.error);
    const parsed = readJson<unknown>(localStorage, CHARACTERS_KEY);
    return isCharacterList(parsed) ? parsed : [];
  } catch (error) {
    console.warn('[MPStorys] Failed to load characters; stored data was preserved.', error);
    return [];
  }
}

function saveLocalCharacters(chars: CharacterProfile[]) {
  return writeJsonWithRecovery(localStorage, CHARACTERS_KEY, chars);
}

function checklistKey(charId: string) {
  return `maplehub-checklist-${charId}:v2`;
}

function legacyChecklistKey(charId: string) {
  return `maplehub-checklist-${charId}`;
}

function checklistConfigKey(charId: string) {
  return `maplehub-checklist-config-${charId}:v1`;
}

export function buildImportMutations(
  envelope: {
    characters: CharacterProfile[];
    checklists: Record<string, TaskState>;
    checklistConfigs: Record<string, ChecklistConfiguration>;
    newsState: Record<string, unknown> | null;
    preferences: Record<string, string>;
  },
  existingCharacters: CharacterProfile[],
): Array<{ key: string; value: string | null }> {
  const mutations: Array<{ key: string; value: string | null }> = [
    { key: CHARACTERS_KEY, value: JSON.stringify(envelope.characters) },
  ];
  for (const [characterId, checklist] of Object.entries(envelope.checklists)) {
    mutations.push({ key: checklistKey(characterId), value: JSON.stringify(checklist) });
  }
  for (const [characterId, config] of Object.entries(envelope.checklistConfigs)) {
    mutations.push({ key: checklistConfigKey(characterId), value: JSON.stringify(config) });
  }
  const incomingIds = new Set(envelope.characters.map((character) => character.id));
  for (const character of existingCharacters) {
    if (!incomingIds.has(character.id)) {
      mutations.push({ key: checklistKey(character.id), value: null });
      mutations.push({ key: checklistConfigKey(character.id), value: null });
    }
  }
  for (const character of envelope.characters) {
    if (!envelope.checklistConfigs[character.id]) {
      mutations.push({ key: checklistConfigKey(character.id), value: null });
    }
  }
  mutations.push({
    key: NEWS_STATE_KEY,
    value: envelope.newsState === null ? null : JSON.stringify(envelope.newsState),
  });
  for (const key of PREFERENCE_KEYS) {
    mutations.push({ key, value: envelope.preferences[key] ?? null });
  }
  return mutations;
}

export function resolveActiveCharacter(
  characters: CharacterProfile[],
  checklists: Record<string, TaskState>,
  checklistConfigs: Record<string, ChecklistConfiguration> = {},
): { activeCharId: string | null; tasks: TaskState; checklistConfig: ChecklistConfiguration | null } {
  const nextActive = characters.find((character) => character.isDefault) ?? characters[0] ?? null;
  return {
    activeCharId: nextActive?.id ?? null,
    tasks: nextActive ? checklists[nextActive.id] ?? {} : {},
    checklistConfig: nextActive ? checklistConfigs[nextActive.id] ?? null : null,
  };
}

function loadChecklist(charId: string): TaskState {
  try {
    const migration = migrateStorageKey(localStorage, legacyChecklistKey(charId), checklistKey(charId), isTaskState);
    if (migration.status === 'failed') console.warn('[MPStorys] Checklist migration failed; legacy data was preserved.', migration.error);
    const parsed = readJson<unknown>(localStorage, checklistKey(charId));
    return isTaskState(parsed) ? parsed : {};
  } catch (error) {
    console.warn('[MPStorys] Failed to load checklist; stored data was preserved.', error);
    return {};
  }
}

function saveChecklist(charId: string, state: TaskState) {
  return writeJsonWithRecovery(localStorage, checklistKey(charId), state);
}

function loadChecklistConfig(charId: string): ChecklistConfiguration | null {
  try {
    const parsed = readJson<unknown>(localStorage, checklistConfigKey(charId));
    return isChecklistConfiguration(parsed) ? parsed : null;
  } catch (error) {
    console.warn('[MPStorys] Failed to load checklist configuration; stored data was preserved.', error);
    return null;
  }
}

function migrateLegacyData(characters: CharacterProfile[]): CharacterProfile[] {
  if (characters.length > 0) return characters;

  const legacyRaw = localStorage.getItem(LEGACY_CHECKLIST_KEY);
  if (!legacyRaw) return characters;

  const defaultChar: CharacterProfile = {
    id: generateId(),
    name: 'My Character',
    className: '',
    level: 1,
    server: '',
    world: '',
    isDefault: true,
  };

  try {
    const parsed = JSON.parse(legacyRaw) as unknown;
    if (!isTaskState(parsed)) throw new Error('Legacy checklist payload failed validation.');
    const backupResult = writeStorageValueWithRecovery(localStorage, `${checklistKey(defaultChar.id)}:v1-backup`, legacyRaw);
    if ('error' in backupResult) throw backupResult.error;
    const checklistResult = writeStorageValueWithRecovery(localStorage, checklistKey(defaultChar.id), legacyRaw);
    if ('error' in checklistResult) throw checklistResult.error;
  } catch (error) {
    console.warn('[MPStorys] Failed to migrate legacy checklist data; legacy data was preserved.', error);
    return characters;
  }

  const updated = [defaultChar];
  const result = saveLocalCharacters(updated);
  return result.ok ? updated : characters;
}

function loadCharactersForCurrentSession() {
  if (typeof window === 'undefined') return [];
  const belongsToAccount = Boolean(localStorage.getItem(ACCOUNT_CACHE_OWNER_KEY));
  if (belongsToAccount && !getAccessToken()) return [];
  return migrateLegacyData(loadLocalCharacters());
}

export function useCharacters() {
  const deferBrowserState = isStaticHydration();
  const [browserStateReady, setBrowserStateReady] = useState(!deferBrowserState);
  const isLoggedIn = browserStateReady && Boolean(getAccessToken());
  const [characters, setCharacters] = useState<CharacterProfile[]>(() => (
    deferBrowserState ? [] : loadCharactersForCurrentSession()
  ));
  const [activeCharId, setActiveCharId] = useState<string | null>(
    () => characters[0]?.id ?? null,
  );
  const [tasks, setTasks] = useState<TaskState>(() =>
    activeCharId ? loadChecklist(activeCharId) : {},
  );
  const [checklistConfig, setChecklistConfig] = useState<ChecklistConfiguration | null>(() =>
    activeCharId ? loadChecklistConfig(activeCharId) : null,
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const prevCharIdRef = useRef(activeCharId);
  const taskOwnerRef = useRef(activeCharId);
  const configOwnerRef = useRef(activeCharId);

  useEffect(() => {
    const reloadAccountData = () => {
      const nextCharacters = loadCharactersForCurrentSession();
      const nextActive = nextCharacters.find((character) => character.isDefault) ?? nextCharacters[0] ?? null;
      taskOwnerRef.current = nextActive?.id ?? null;
      configOwnerRef.current = nextActive?.id ?? null;
      prevCharIdRef.current = nextActive?.id ?? null;
      setCharacters(nextCharacters);
      setActiveCharId(nextActive?.id ?? null);
      setTasks(nextActive ? loadChecklist(nextActive.id) : {});
      setChecklistConfig(nextActive ? loadChecklistConfig(nextActive.id) : null);
    };

    const cancelReload = deferBrowserState
      ? scheduleAfterStaticHydration(() => {
          reloadAccountData();
          setBrowserStateReady(true);
        }, { autoDelayMs: 0 })
      : () => {};
    window.addEventListener(ACCOUNT_CACHE_CHANGED_EVENT, reloadAccountData);
    return () => {
      cancelReload();
      window.removeEventListener(ACCOUNT_CACHE_CHANGED_EVENT, reloadAccountData);
    };
  }, [deferBrowserState]);

  const safeSave = useCallback((key: string, data: unknown) => {
    const result = writeJsonWithRecovery(localStorage, key, data);
    if (result.ok) {
      setSaveError(null);
      setLastSaved(Date.now());
    } else if ('error' in result) {
      const msg = result.quotaExceeded
        ? 'Storage full — your progress is still in this tab but could not be saved. Export your data from Quick Actions to keep it safe.'
        : 'Failed to save data locally.';
      console.warn('[MPStorys]', msg, result.error);
      setSaveError(msg);
    }
  }, []);

  // Persist characters
  useEffect(() => {
    if (!browserStateReady) return;
    safeSave(CHARACTERS_KEY, characters);
  }, [browserStateReady, characters, safeSave]);

  // Switch checklist when active character changes
  useEffect(() => {
    if (activeCharId && activeCharId !== prevCharIdRef.current) {
      taskOwnerRef.current = activeCharId;
      configOwnerRef.current = activeCharId;
      setTasks(loadChecklist(activeCharId));
      setChecklistConfig(loadChecklistConfig(activeCharId));
    }
    prevCharIdRef.current = activeCharId;
  }, [activeCharId]);

  // Persist current checklist
  useEffect(() => {
    if (activeCharId && taskOwnerRef.current === activeCharId) {
      safeSave(checklistKey(activeCharId), tasks);
    }
  }, [tasks, activeCharId, safeSave]);

  useEffect(() => {
    if (activeCharId && checklistConfig && configOwnerRef.current === activeCharId) {
      safeSave(checklistConfigKey(activeCharId), checklistConfig);
    }
  }, [activeCharId, checklistConfig, safeSave]);

  const addCharacter = useCallback((input: Omit<CharacterProfile, 'id' | 'isDefault'>) => {
    const newChar: CharacterProfile = {
      ...input,
      id: generateId(),
      isDefault: characters.length === 0,
    };
    setCharacters((prev) => [...prev, newChar]);
    taskOwnerRef.current = newChar.id;
    configOwnerRef.current = newChar.id;
    setActiveCharId(newChar.id);
    setTasks({});
    setChecklistConfig(null);
    return newChar;
  }, [characters.length]);

  const updateCharacter = useCallback((id: string, input: Partial<Omit<CharacterProfile, 'id' | 'isDefault'>>) => {
    setCharacters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...input } : c)),
    );
  }, []);

  const deleteCharacter = useCallback((id: string) => {
    setCharacters((prev) => {
      const next = prev.filter((c) => c.id !== id);
      localStorage.removeItem(checklistKey(id));
      localStorage.removeItem(checklistConfigKey(id));
      if (id === activeCharId) {
        const fallback = next[0] ?? null;
        taskOwnerRef.current = fallback?.id ?? null;
        configOwnerRef.current = fallback?.id ?? null;
        setActiveCharId(fallback?.id ?? null);
        setTasks(fallback ? loadChecklist(fallback.id) : {});
        setChecklistConfig(fallback ? loadChecklistConfig(fallback.id) : null);
      }
      return next;
    });
  }, [activeCharId]);

  const toggleBoss = useCallback((bossId: string, difficulty: string, limit: number) => {
    setTasks((prev) => {
      const current = prev[bossId]?.[difficulty] ?? 0;
      const next = current >= limit ? 0 : current + 1;
      return { ...prev, [bossId]: { ...prev[bossId], [difficulty]: next } };
    });
  }, []);

  const resetTasks = useCallback(() => {
    setTasks({});
  }, []);

  const replaceTaskSelection = useCallback((selectedTaskIds: string[]) => {
    setChecklistConfig({ selectedTaskIds: [...new Set(selectedTaskIds)], updatedAt: new Date().toISOString() });
  }, []);

  const exportData = useCallback(() => {
    const checklists = Object.fromEntries(
      characters.map((character) => [character.id, loadChecklist(character.id)]),
    );
    const checklistConfigs = Object.fromEntries(
      characters.flatMap((character) => {
        const config = loadChecklistConfig(character.id);
        return config ? [[character.id, config] as const] : [];
      }),
    );
    const preferences = Object.fromEntries(
      PREFERENCE_KEYS.flatMap((key) => {
        const value = localStorage.getItem(key);
        return value === null ? [] : [[key, value]];
      }),
    );
    let newsState: Record<string, unknown> | null = null;
    try {
      const storedNewsState = readJson<unknown>(localStorage, NEWS_STATE_KEY);
      newsState = isNewsState(storedNewsState) ? storedNewsState : null;
    } catch {
      // A corrupt optional news-state key must not block exporting core player data.
    }

    const envelope: MapleHubExportEnvelope = {
      format: EXPORT_FORMAT,
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      characters,
      checklists,
      checklistConfigs,
      newsState,
      preferences,
    };
    return JSON.stringify(envelope, null, 2);
  }, [characters]);

  const importData = useCallback((text: string) => {
    const parsed = parseMapleHubImport(text);
    if ('reason' in parsed) return { ok: false as const, message: `Import rejected: ${parsed.reason}.` };
    const { envelope } = parsed;

    const mutations = buildImportMutations(envelope, characters);
    const transaction = applyStorageTransaction(localStorage, mutations);
    if ('error' in transaction) {
      if (transaction.rollbackError) console.error('[MPStorys] Import rollback failed.', transaction.rollbackError);
      console.warn('[MPStorys] Import failed; previous data was restored.', transaction.error);
      return { ok: false as const, message: 'Import failed. Your previous data was restored.' };
    }

    setCharacters(envelope.characters);
    const {
      activeCharId: nextId,
      tasks: nextTasks,
      checklistConfig: nextConfig,
    } = resolveActiveCharacter(envelope.characters, envelope.checklists, envelope.checklistConfigs);
    taskOwnerRef.current = nextId;
    configOwnerRef.current = nextId;
    setActiveCharId(nextId);
    setTasks(nextTasks);
    setChecklistConfig(nextConfig);
    setSaveError(null);
    setLastSaved(Date.now());
    return { ok: true as const, message: 'MPStorys data imported successfully.' };
  }, [characters]);

  const activeCharacter = characters.find((c) => c.id === activeCharId) ?? null;

  const deleteLocalData = useCallback(() => {
    const removedKeys = deleteAllPlayerData(localStorage);
    setCharacters([]);
    taskOwnerRef.current = null;
    configOwnerRef.current = null;
    setActiveCharId(null);
    setTasks({});
    setChecklistConfig(null);
    setSaveError(null);
    setLastSaved(Date.now());
    return removedKeys;
  }, []);

  return {
    characters,
    activeCharacter,
    activeCharId,
    setActiveCharId: useCallback((id: string | null) => {
      setActiveCharId(id);
    }, []),
    tasks,
    setTasks,
    checklistConfig,
    setChecklistConfig,
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
  };
}
