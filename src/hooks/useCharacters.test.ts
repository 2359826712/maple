import { describe, expect, it } from 'vitest';
import { buildImportMutations, parseMapleHubImport, resolveActiveCharacter } from './useCharacters';
import type { CharacterProfile, TaskState } from './useCharacters';
import { applyStorageTransaction } from '@/services/persistentStorage';

const validEnvelope = {
  format: 'maplehub-export',
  version: 1,
  exportedAt: '2026-07-11T00:00:00.000Z',
  characters: [{
    id: 'local-1',
    name: 'Mapler',
    className: '',
    level: 250,
    server: 'gms',
    world: '',
    isDefault: true,
  }],
  checklists: { 'local-1': { lotus: { Normal: 1 } } },
  newsState: null,
  preferences: { 'maplehub-game-version': 'gms' },
};

describe('MapleHub backup validation', () => {
  it('accepts the documented version-one envelope', () => {
    const result = parseMapleHubImport(JSON.stringify(validEnvelope));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.envelope.version).toBe(2);
      expect(result.envelope.checklistConfigs).toEqual({});
    }
  });

  it('accepts the current version-two envelope with validated checklist configuration', () => {
    const result = parseMapleHubImport(JSON.stringify({
      ...validEnvelope,
      version: 2,
      checklistConfigs: {
        'local-1': { selectedTaskIds: ['lotus:Normal'], updatedAt: '2026-07-11T00:00:00.000Z' },
      },
    }));
    expect(result.ok).toBe(true);
  });

  it('rejects unknown top-level fields', () => {
    const result = parseMapleHubImport(JSON.stringify({ ...validEnvelope, execute: 'nope' }));
    expect(result).toEqual({ ok: false, reason: 'invalid-schema' });
  });

  it('rejects corrupt JSON and unsupported versions', () => {
    expect(parseMapleHubImport('{broken')).toEqual({ ok: false, reason: 'invalid-json' });
    expect(parseMapleHubImport(JSON.stringify({ ...validEnvelope, version: 99 }))).toEqual({ ok: false, reason: 'invalid-schema' });
  });

  it('rejects payloads larger than five megabytes before parsing', () => {
    const result = parseMapleHubImport('x'.repeat(5 * 1024 * 1024 + 1));
    expect(result).toEqual({ ok: false, reason: 'too-large' });
  });

  it('rejects unknown and missing fields inside character records', () => {
    const withExtra = structuredClone(validEnvelope);
    Object.assign(withExtra.characters[0], { script: 'nope' });
    expect(parseMapleHubImport(JSON.stringify(withExtra))).toEqual({ ok: false, reason: 'invalid-schema' });

    const withMissing = structuredClone(validEnvelope) as typeof validEnvelope & { characters: Array<Record<string, unknown>> };
    delete withMissing.characters[0].className;
    expect(parseMapleHubImport(JSON.stringify(withMissing))).toEqual({ ok: false, reason: 'invalid-schema' });
  });

  it('rejects duplicate identities, multiple defaults, and orphaned checklists', () => {
    const duplicate = structuredClone(validEnvelope);
    duplicate.characters.push({ ...duplicate.characters[0] });
    expect(parseMapleHubImport(JSON.stringify(duplicate))).toEqual({ ok: false, reason: 'invalid-schema' });

    const multipleDefaults = structuredClone(validEnvelope);
    multipleDefaults.characters.push({ ...multipleDefaults.characters[0], id: 'local-2' });
    expect(parseMapleHubImport(JSON.stringify(multipleDefaults))).toEqual({ ok: false, reason: 'invalid-schema' });

    const orphaned = structuredClone(validEnvelope);
    orphaned.checklists['unknown-character'] = { lotus: { Normal: 1 } };
    expect(parseMapleHubImport(JSON.stringify(orphaned))).toEqual({ ok: false, reason: 'invalid-schema' });
  });

  it('validates checklist counts, news state, and preference allowlists', () => {
    const fractionalCount = structuredClone(validEnvelope);
    fractionalCount.checklists['local-1'].lotus.Normal = 0.5;
    expect(parseMapleHubImport(JSON.stringify(fractionalCount))).toEqual({ ok: false, reason: 'invalid-schema' });

    const badNewsState = { ...structuredClone(validEnvelope), newsState: { saved: { article: 'yes' }, read: {} } };
    expect(parseMapleHubImport(JSON.stringify(badNewsState))).toEqual({ ok: false, reason: 'invalid-schema' });

    const unknownPreference = structuredClone(validEnvelope);
    unknownPreference.preferences['auth-token'] = 'secret';
    expect(parseMapleHubImport(JSON.stringify(unknownPreference))).toEqual({ ok: false, reason: 'invalid-schema' });
  });

  it('rejects prototype-pollution keys at arbitrary-record boundaries', () => {
    const payload = JSON.stringify(validEnvelope).replace(
      '"checklists":{',
      '"checklists":{"__proto__":{"polluted":{"Normal":1}},',
    );
    expect(parseMapleHubImport(payload)).toEqual({ ok: false, reason: 'invalid-schema' });
    expect(({} as { polluted?: unknown }).polluted).toBeUndefined();
  });

  it('survives a deterministic malformed-input fuzz corpus without accepting it', () => {
    let state = 0x5eed1234;
    const next = () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state;
    };
    const alphabet = '{}[],:"\\0123456789abcdefghijklmnopqrstuvwxyz\u0000\n\r\t';

    for (let caseIndex = 0; caseIndex < 500; caseIndex += 1) {
      const length = 1 + (next() % 512);
      let input = '';
      for (let index = 0; index < length; index += 1) input += alphabet[next() % alphabet.length];
      expect(() => parseMapleHubImport(input)).not.toThrow();
      expect(parseMapleHubImport(input).ok).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// Import transaction tests with conflict fixtures
// ---------------------------------------------------------------------------

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  failKey: string | null = null;
  failNextWriteWithQuota = false;

  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) {
    if (key === this.failKey) throw new Error(`Write failed for ${key}`);
    if (this.failNextWriteWithQuota) {
      this.failNextWriteWithQuota = false;
      throw new DOMException('Storage quota exceeded', 'QuotaExceededError');
    }
    this.values.set(key, value);
  }
  has(key: string) { return this.values.has(key); }
  keys() { return [...this.values.keys()]; }
}

function makeChar(id: string, overrides: Partial<CharacterProfile> = {}): CharacterProfile {
  return { id, name: `Char-${id}`, className: '', level: 250, server: 'gms', world: '', isDefault: false, ...overrides };
}

function makeEnvelope(
  characters: CharacterProfile[],
  checklists: Record<string, TaskState>,
  extras: {
    newsState?: Record<string, unknown> | null;
    preferences?: Record<string, string>;
    checklistConfigs?: Record<string, { selectedTaskIds: string[]; updatedAt: string }>;
  } = {},
) {
  return {
    format: 'maplehub-export' as const,
    version: 2 as const,
    exportedAt: '2026-07-11T12:00:00.000Z',
    characters,
    checklists,
    checklistConfigs: extras.checklistConfigs ?? {},
    newsState: extras.newsState ?? null,
    preferences: extras.preferences ?? {},
  };
}

const CHAR_KEY = 'maplehub-characters:v2';
const NEWS_KEY = 'maplehub-news-state:v1';

function checklistKeyFor(id: string) { return `maplehub-checklist-${id}:v2`; }

describe('F-02 import transaction — conflict fixtures', () => {
  it('full replace with overlap: deletes removed character checklist, overwrites shared, adds new', () => {
    const storage = new MemoryStorage();
    const existing = [makeChar('A', { isDefault: true }), makeChar('B')];
    storage.setItem(CHAR_KEY, JSON.stringify(existing));
    storage.setItem(checklistKeyFor('A'), JSON.stringify({ lotus: { Normal: 1 } }));
    storage.setItem(checklistKeyFor('B'), JSON.stringify({ zakum: { Easy: 1 } }));

    const incoming = makeEnvelope(
      [makeChar('B', { level: 260 }), makeChar('C', { isDefault: true })],
      {
        B: { zakum: { Normal: 1, Chaos: 1 } },
        C: { magnus: { Hard: 1 } },
      },
    );

    const mutations = buildImportMutations(incoming, existing);
    const result = applyStorageTransaction(storage, mutations);
    expect('error' in result).toBe(false);

    // A's checklist must be deleted (not in incoming)
    expect(storage.getItem(checklistKeyFor('A'))).toBeNull();
    // B's checklist must be overwritten
    expect(JSON.parse(storage.getItem(checklistKeyFor('B'))!)).toEqual({ zakum: { Normal: 1, Chaos: 1 } });
    // C's checklist must be created
    expect(JSON.parse(storage.getItem(checklistKeyFor('C'))!)).toEqual({ magnus: { Hard: 1 } });
    // Characters must be replaced
    const chars = JSON.parse(storage.getItem(CHAR_KEY)!) as CharacterProfile[];
    expect(chars.map((c) => c.id)).toEqual(['B', 'C']);
  });

  it('full replace without overlap: all old checklists removed, new data installed', () => {
    const storage = new MemoryStorage();
    const existing = [makeChar('X', { isDefault: true })];
    storage.setItem(CHAR_KEY, JSON.stringify(existing));
    storage.setItem(checklistKeyFor('X'), JSON.stringify({ lotus: { Hard: 1 } }));

    const incoming = makeEnvelope(
      [makeChar('Y'), makeChar('Z', { isDefault: true })],
      { Y: { zakum: { Chaos: 1 } }, Z: { magnus: { Easy: 1 } } },
    );

    const mutations = buildImportMutations(incoming, existing);
    const result = applyStorageTransaction(storage, mutations);
    expect('error' in result).toBe(false);

    expect(storage.getItem(checklistKeyFor('X'))).toBeNull();
    expect(JSON.parse(storage.getItem(checklistKeyFor('Y'))!)).toEqual({ zakum: { Chaos: 1 } });
    expect(JSON.parse(storage.getItem(checklistKeyFor('Z'))!)).toEqual({ magnus: { Easy: 1 } });
  });

  it('empty to populated: no deletions, all incoming data installed', () => {
    const storage = new MemoryStorage();
    const existing: CharacterProfile[] = [];

    const incoming = makeEnvelope(
      [makeChar('new-1', { isDefault: true })],
      { 'new-1': { lotus: { Normal: 1 } } },
    );

    const mutations = buildImportMutations(incoming, existing);
    const result = applyStorageTransaction(storage, mutations);
    expect('error' in result).toBe(false);

    expect(JSON.parse(storage.getItem(CHAR_KEY)!)).toHaveLength(1);
    expect(JSON.parse(storage.getItem(checklistKeyFor('new-1'))!)).toEqual({ lotus: { Normal: 1 } });
  });

  it('news state and preferences are overwritten; omitted preferences cleared', () => {
    const storage = new MemoryStorage();
    storage.setItem(NEWS_KEY, JSON.stringify({ saved: { old: true }, read: { old: true } }));
    storage.setItem('maplehub-theme', 'dark');
    storage.setItem('maplehub-language', 'en');

    const incoming = makeEnvelope(
      [makeChar('p-1', { isDefault: true })],
      { 'p-1': {} },
      {
        newsState: { saved: { fresh: true }, read: {} },
        preferences: { 'maplehub-game-version': 'kms' },
      },
    );

    const mutations = buildImportMutations(incoming, []);
    const result = applyStorageTransaction(storage, mutations);
    expect('error' in result).toBe(false);

    expect(JSON.parse(storage.getItem(NEWS_KEY)!)).toEqual({ saved: { fresh: true }, read: {} });
    expect(storage.getItem('maplehub-game-version')).toBe('kms');
    // Theme and language were not in incoming preferences → cleared
    expect(storage.getItem('maplehub-theme')).toBeNull();
    expect(storage.getItem('maplehub-language')).toBeNull();
  });

  it('null news state clears stored news state', () => {
    const storage = new MemoryStorage();
    storage.setItem(NEWS_KEY, JSON.stringify({ saved: { stale: true }, read: {} }));

    const incoming = makeEnvelope([makeChar('n-1', { isDefault: true })], { 'n-1': {} });
    const mutations = buildImportMutations(incoming, []);
    applyStorageTransaction(storage, mutations);

    expect(storage.getItem(NEWS_KEY)).toBeNull();
  });

  it('resolves active character to isDefault, falling back to first', () => {
    const chars = [makeChar('a'), makeChar('b', { isDefault: true }), makeChar('c')];
    const checklists: Record<string, TaskState> = {
      a: { lotus: { Normal: 1 } },
      b: { zakum: { Chaos: 1 } },
      c: {},
    };
    const { activeCharId, tasks } = resolveActiveCharacter(chars, checklists);
    expect(activeCharId).toBe('b');
    expect(tasks).toEqual({ zakum: { Chaos: 1 } });
  });

  it('resolves active character to first when no default is set', () => {
    const chars = [makeChar('x'), makeChar('y')];
    const checklists: Record<string, TaskState> = { x: { lotus: { Normal: 1 } }, y: {} };
    const { activeCharId, tasks } = resolveActiveCharacter(chars, checklists);
    expect(activeCharId).toBe('x');
    expect(tasks).toEqual({ lotus: { Normal: 1 } });
  });

  it('resolves null when character list is empty', () => {
    const { activeCharId, tasks } = resolveActiveCharacter([], {});
    expect(activeCharId).toBeNull();
    expect(tasks).toEqual({});
  });

  it('active character uses empty tasks when checklist is missing', () => {
    const chars = [makeChar('only', { isDefault: true })];
    const { activeCharId, tasks } = resolveActiveCharacter(chars, {});
    expect(activeCharId).toBe('only');
    expect(tasks).toEqual({});
  });

  it('transaction rollback restores previous state on write failure', () => {
    const storage = new MemoryStorage();
    const existing = [makeChar('safe', { isDefault: true })];
    storage.setItem(CHAR_KEY, JSON.stringify(existing));
    const previousChecklist = { lotus: { Normal: 1 } };
    storage.setItem(checklistKeyFor('safe'), JSON.stringify(previousChecklist));

    const incoming = makeEnvelope(
      [makeChar('other', { isDefault: true })],
      { other: { magnus: { Hard: 1 } } },
    );

    const mutations = buildImportMutations(incoming, existing);
    // Simulate a persistent write failure on the first mutation key (characters)
    storage.failKey = CHAR_KEY;
    const result = applyStorageTransaction(storage, mutations);
    expect('error' in result).toBe(true);

    // Previous data must be restored after rollback
    expect(JSON.parse(storage.getItem(CHAR_KEY)!)).toEqual(existing);
    expect(JSON.parse(storage.getItem(checklistKeyFor('safe'))!)).toEqual(previousChecklist);
  });

  it('deletes multiple stale checklists when importing a non-overlapping set', () => {
    const storage = new MemoryStorage();
    const existing = [makeChar('old-1'), makeChar('old-2'), makeChar('old-3')];
    for (const c of existing) {
      storage.setItem(checklistKeyFor(c.id), JSON.stringify({ lotus: { Normal: 1 } }));
    }

    const incoming = makeEnvelope(
      [makeChar('new-1', { isDefault: true })],
      { 'new-1': { zakum: { Normal: 1 } } },
    );

    const mutations = buildImportMutations(incoming, existing);
    const deletions = mutations.filter((m) => m.value === null);
    // Three stale progress keys and their configs are removed; the incoming
    // character's missing config is also explicitly cleared.
    expect(deletions.filter((m) => /^maplehub-checklist-(?!config-)/.test(m.key))).toHaveLength(3);
    expect(deletions.filter((m) => m.key.startsWith('maplehub-checklist-config-'))).toHaveLength(4);

    applyStorageTransaction(storage, mutations);
    for (const c of existing) {
      expect(storage.getItem(checklistKeyFor(c.id))).toBeNull();
    }
    expect(JSON.parse(storage.getItem(checklistKeyFor('new-1'))!)).toEqual({ zakum: { Normal: 1 } });
  });

  it('preserves incoming checklist data exactly (no merging with existing)', () => {
    const storage = new MemoryStorage();
    storage.setItem(checklistKeyFor('shared'), JSON.stringify({
      lotus: { Normal: 1, Hard: 1 },
      zakum: { Easy: 1, Normal: 1 },
    }));

    const incoming = makeEnvelope(
      [makeChar('shared', { isDefault: true })],
      { shared: { lotus: { Normal: 0 } } },
    );

    const mutations = buildImportMutations(incoming, [makeChar('shared')]);
    applyStorageTransaction(storage, mutations);

    // Must be fully replaced, not merged — zakum disappears, Hard disappears, Normal resets to 0
    expect(JSON.parse(storage.getItem(checklistKeyFor('shared'))!)).toEqual({ lotus: { Normal: 0 } });
  });
});
