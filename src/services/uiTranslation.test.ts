import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { mergePublishedUiTranslations } from './uiTranslation';

const hash = (value: string) =>
  createHash('sha256').update(value, 'utf8').digest('hex');

describe('mergePublishedUiTranslations', () => {
  it('overlays a published translation only when its English source is current', () => {
    const source = {
      mh_character_profile: 'Character Profile',
      mh_favorites: 'Favorites',
    };

    expect(
      mergePublishedUiTranslations(
        source,
        {
          mh_character_profile: '角色档案（静态）',
          mh_favorites: '收藏',
        },
        [
          {
            translation_key: 'mh_character_profile',
            translated_text: '角色档案',
            source_hash: hash('Character Profile'),
          },
          {
            translation_key: 'mh_favorites',
            translated_text: '过期收藏',
            source_hash: hash('Old Favorites'),
          },
        ],
      ),
    ).toEqual({
      mh_character_profile: '角色档案',
      mh_favorites: '收藏',
    });
  });

  it('ignores rows that do not exist in the current English dictionary', () => {
    expect(
      mergePublishedUiTranslations(
        {},
        { existing: '现有文案' },
        [
          {
            translation_key: 'removed_key',
            translated_text: '已删除文案',
            source_hash: hash('Removed'),
          },
        ],
      ),
    ).toEqual({ existing: '现有文案' });
  });
});
