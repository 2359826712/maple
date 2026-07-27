# Series tools capability matrix

The primary `/tools` route is the native MapleStory workspace. Series routes use clean,
server-rendered URLs under `/series/{series}/tools`.

| Series | On-site capability |
| --- | --- |
| MapleStory | Character lookup, progression, boss, HEXA, Link Skill, Legion, enhancement, map, class, and fashion workspaces |
| MapleStory Classic World | Persistent readiness checklist plus indexed route, combat, progression, scroll, and stat tools |
| MapleStory M | Persistent update checklist plus the indexed powder-cost calculator |
| MapleStory N | Persistent service checklist plus indexed Star Force, cube, flame, stat, equipment, symbol, V Matrix, and reward tools |
| MapleStory Worlds | Persistent creator release checklist; it remains useful when no verified calculator exists |
| MapleStory: Idle RPG | Persistent season checklist plus indexed summon, experience, equipment, hero-token, and combat tools |

The fallback rule is capability-based:

1. Render a native calculator/planner when a verified resource maps to a supported tool kind.
2. Otherwise render the series’ persistent on-site checklist.
3. Keep the verified source URL available as evidence, not as the only interaction.
