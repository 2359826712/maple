import { calculateEventStatus } from './content/events.mjs';
import { readContentRecords, writeJson } from './content/data.mjs';
import { createContentHash } from './content/identity.mjs';
import { createRevisionSnapshot } from './content/snapshots.mjs';

const execute = process.argv.includes('--execute');
const now = new Date();
const records = (await readContentRecords()).filter((record) => record.data.content_type === 'event');
let changed = 0;

for (const record of records) {
  const calendarStatus = calculateEventStatus(record.data, { now });
  const contentStatus = calendarStatus === 'ended' ? 'expired' : record.data.status;
  if (calendarStatus === record.data.calendar_status && contentStatus === record.data.status) continue;
  const next = { ...record.data, calendar_status: calendarStatus, status: contentStatus, last_checked: now.toISOString() };
  next.content_hash = createContentHash(next);
  if (execute) {
    await createRevisionSnapshot(record.data, next, { detectedAt: now.toISOString() });
    await writeJson(record.filePath, next);
  }
  changed += 1;
}

console.log(`${execute ? 'Updated' : 'Would update'} ${changed} of ${records.length} event record(s).${execute ? '' : ' Pass --execute to write changes.'}`);
