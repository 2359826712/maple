// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import {
  isRankingVersionSupported,
  normalizeTmsRankingPage,
  parseJmsRankingPage,
  parseKmsRankingPage,
} from './nexonRankings';

describe('regional official rankings', () => {
  it('supports the official GMS, KMS, JMS, and TMS ranking sources', () => {
    expect(isRankingVersionSupported('gms')).toBe(true);
    expect(isRankingVersionSupported('kms')).toBe(true);
    expect(isRankingVersionSupported('jms')).toBe(true);
    expect(isRankingVersionSupported('tms')).toBe(true);
    expect(isRankingVersionSupported('msea')).toBe(false);
  });

  it('parses KMS ranking rows and preserves official pagination', () => {
    const page = parseKmsRankingPage(`
      <table class="rank_table"><tbody><tr class="rank01">
        <td><p class="'ranking_num'"><img alt="1등"></p></td>
        <td class="left"><span class="char_img"><img src="/avatar.png"><img class="bg"></span><dl><dt><a>오지환</a></dt><dd>키네시스</dd></dl></td>
        <td>Lv.300</td><td>1,234</td><td>99,999</td><td>Guild</td>
      </tr></tbody></table>
      <a href="/N23Ranking/World/Total?page=2">2</a>
    `, 1);

    expect(page.ranks).toHaveLength(1);
    expect(page.ranks[0]).toMatchObject({ rank: 1, characterName: '오지환', jobName: '키네시스', level: 300, exp: 1234 });
    expect(page.pageCount).toBe(2);
  });

  it('parses the KMS text mirror when the official HTML transport is unavailable', () => {
    const page = parseKmsRankingPage(`
| 순위 | 캐릭터 정보 | 레벨 | 경험치 | 인기도 | 길드 |
| --- | --- | --- | --- | --- | --- |
| ![Image: 1등](https://example.com/one.png) | ![Avatar](https://avatar.maplestory.nexon.com/CharacterEx/180/ABC)[오지환](https://maplestory.nexon.com/Common/Character/Detail/%EC%98%A4%EC%A7%80%ED%99%98?p=token)키네시스 | Lv.300 | 1,234 | 99,999 | Guild |
[2](http://maplestory.nexon.com/N23Ranking/World/Total?page=2)
    `, 1);

    expect(page.ranks[0]).toMatchObject({ rank: 1, characterName: '오지환', jobName: '키네시스', level: 300, exp: 1234 });
    expect(page.pageCount).toBe(2);
  });

  it('parses every JMS row returned by the official page', () => {
    const page = parseJmsRankingPage(`
      <ol id="ranklist">
        <li><ul><li class="rank-001"><span>1</span>位</li><li class="avatar"><img src="//avatar.example/one.png"><span>MaplerOne</span></li><li class="world">かえで</li><li class="level"><span>299</span>レベル</li><li class="job">アーク</li></ul></li>
        <li><ul><li class="rank-002"><span>2</span>位</li><li class="avatar"><span>MaplerTwo</span></li><li class="world">くるみ</li><li class="level"><span>298</span>レベル</li><li class="job">カンナ</li></ul></li>
      </ol>
      <a onclick="UpdatePaging(2)">次へ</a>
    `, 1);

    expect(page.ranks.map((rank) => rank.characterName)).toEqual(['MaplerOne', 'MaplerTwo']);
    expect(page.ranks[0]).toMatchObject({ worldName: 'かえで', level: 299, jobName: 'アーク' });
    expect(page.pageCount).toBe(2);
  });

  it('normalizes all TMS Union rows and page count', () => {
    const page = normalizeTmsRankingPage({
      code: 1,
      data: {
        pageCount: 10,
        rankDatas: [
          {
            rank: 1,
            gameWorldId: 0,
            gameWorldName: '艾麗亞',
            characterName: '一心追風r',
            characterLookUrl: 'https://example.com/look.png',
            jobName: '破風使者',
            unionDPS: 2129556585,
            unionTotalLevel: 11568,
            unionLevel: 290,
          },
        ],
      },
    }, 1);

    expect(page.pageCount).toBe(10);
    expect(page.hasNext).toBe(true);
    expect(page.ranks[0]).toMatchObject({
      characterName: '一心追風r',
      worldName: '艾麗亞',
      level: 290,
      raidPower: 2129556585,
      legionLevel: 11568,
    });
  });
});
