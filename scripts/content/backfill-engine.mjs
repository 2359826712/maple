const duration = (milliseconds) => {
  const seconds = Math.max(0, Math.round(milliseconds / 1000));
  const minutes = Math.floor(seconds / 60);
  return minutes ? `${minutes}m${String(seconds % 60).padStart(2, '0')}s` : `${seconds}s`;
};

export function formatBackfillProgress({ sourceId, state, totalPages = null, now = Date.now() }) {
  const width = 12;
  const ratio = totalPages ? Math.min(1, state.pages_completed / totalPages) : null;
  const filled = ratio === null ? Math.min(width, state.pages_completed % (width + 1)) : Math.round(width * ratio);
  const bar = `${'█'.repeat(filled)}${'░'.repeat(width - filled)}`;
  const elapsed = Math.max(1, now - Date.parse(state.run_started_at || state.started_at));
  const eta = totalPages && state.pages_completed
    ? duration((elapsed / state.pages_completed) * Math.max(0, totalPages - state.pages_completed))
    : 'Unknown';
  return `${sourceId} ${bar} Page ${state.current_page} / ${totalPages ?? 'Unknown'} `
    + `Processed ${state.items_processed} Saved ${state.items_saved} Skipped ${state.items_skipped} `
    + `ParserErrors ${state.parser_errors} Retries ${state.retry_count} ETA ${eta}`;
}

export function createProgressLogger(stream = process.stdout) {
  return (message) => {
    const value = String(message);
    const progress = value.includes('█') || value.includes('░');
    if (stream.isTTY && progress) stream.write(`\r${value}\u001b[K`);
    else stream.write(`${stream.isTTY ? '\n' : ''}${value}\n`);
  };
}

export function backfillMetrics(state, now = Date.now()) {
  const elapsedMs = Math.max(0, now - Date.parse(state.run_started_at || state.started_at));
  return {
    total_pages: state.pages_completed + state.pages_failed,
    successful_pages: state.pages_completed,
    failed_pages: state.pages_failed,
    total_articles: state.items_processed,
    added: state.items_added ?? state.items_saved,
    updated: state.items_updated,
    duplicates: state.duplicates,
    skipped: state.items_skipped,
    parser_errors: state.parser_errors,
    http_errors: state.http_errors,
    retries: state.retry_count,
    elapsed_ms: elapsedMs,
    average_page_ms: state.pages_completed ? Math.round(elapsedMs / state.pages_completed) : 0,
    average_article_ms: state.items_processed ? Math.round(elapsedMs / state.items_processed) : 0,
  };
}

export async function runBackfillEngine({
  source,
  adapter,
  context,
  initialState,
  maxPages = Infinity,
  duplicateThreshold = 100,
  consecutive404Limit = 3,
  processItems,
  checkpoint = async () => {},
  log = () => {},
  stopRequested = () => false,
  now = () => new Date(),
}) {
  if (initialState.completed === true && !initialState.next_page) {
    const state = { ...initialState };
    log(`${source.id}: checkpoint already complete; no pages processed`);
    return { state, metrics: backfillMetrics(state, now().getTime()), supported: true };
  }
  const state = { ...initialState, completed: false, stop_reason: null, run_started_at: now().toISOString() };
  const pagesAtStart = state.pages_completed + state.pages_failed;
  const retriesAtStart = state.retry_count;
  const pagination = typeof adapter.discoverPages === 'function'
    ? await adapter.discoverPages(source, context)
    : { supported: false };
  if (!pagination?.supported) {
    state.completed = true;
    state.stop_reason = 'no-pagination-supported';
    state.updated_at = now().toISOString();
    log(`${source.id}: No pagination supported`);
    return { state, metrics: backfillMetrics(state, now().getTime()), supported: false };
  }

  let page = state.next_page || pagination.firstPage;
  let totalPages = pagination.totalPages ?? null;
  while (page) {
    if (state.pages_completed + state.pages_failed - pagesAtStart >= maxPages) {
      state.stop_reason = 'max-pages';
      break;
    }
    const pageStarted = now().getTime();
    let result;
    let items = [];
    let pageFailed = false;
    try {
      result = await adapter.fetchPage(page, source, context);
      if (result.status === 404) {
        state.consecutive_404s += 1;
        state.http_errors += 1;
        pageFailed = true;
      } else if (result.status >= 400) {
        state.http_errors += 1;
        pageFailed = true;
      } else {
        state.consecutive_404s = 0;
        items = await adapter.discoverItems(result, page, source, context);
      }
    } catch (error) {
      state.http_errors += 1;
      pageFailed = true;
      log(`${source.id}: page ${page.index} failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    const counts = pageFailed
      ? { processed: 0, added: 0, updated: 0, duplicates: 0, skipped: 0, parserErrors: 0, httpErrors: 0 }
      : await processItems(items, page);
    state.current_page = page.index;
    state.last_cursor = page.cursor ?? page.token ?? null;
    state.last_page_url = result?.finalUrl || page.url || null;
    state.items_processed += counts.processed;
    state.items_saved += counts.added + counts.updated;
    state.items_added = (state.items_added || 0) + counts.added;
    state.items_updated += counts.updated;
    state.items_skipped += counts.skipped;
    state.duplicates += counts.duplicates;
    state.parser_errors += counts.parserErrors;
    state.http_errors += counts.httpErrors;
    state.retry_count = retriesAtStart + (context.clientMetrics?.retries || 0);
    if (counts.trailingDuplicates != null) {
      state.consecutive_duplicates = counts.trailingDuplicates === counts.processed
        ? state.consecutive_duplicates + counts.trailingDuplicates
        : counts.trailingDuplicates;
    } else {
      state.consecutive_duplicates = counts.processed > 0 && counts.duplicates === counts.processed
        ? state.consecutive_duplicates + counts.duplicates
        : 0;
    }
    if (pageFailed) state.pages_failed += 1;
    else state.pages_completed += 1;

    const next = await adapter.discoverNextPage(page, result, items, source, context);
    if (next?.totalPages != null) totalPages = next.totalPages;
    state.next_page = next?.page || null;
    state.updated_at = now().toISOString();
    state.last_page_elapsed_ms = Math.max(0, now().getTime() - pageStarted);

    if (state.consecutive_404s >= consecutive404Limit) state.stop_reason = 'consecutive-404s';
    else if (state.consecutive_duplicates >= duplicateThreshold) state.stop_reason = 'duplicate-threshold';
    else if (stopRequested()) state.stop_reason = 'interrupted';
    else if (!state.next_page) state.stop_reason = next?.reason || 'last-page';
    else if (state.pages_completed + state.pages_failed - pagesAtStart >= maxPages) state.stop_reason = 'max-pages';

    await checkpoint(state);
    log(`BACKFILL_PAGE ${JSON.stringify({
      source_id: source.id,
      page: page.index,
      request_urls: result?.requestUrls || page.requestUrls || [result?.finalUrl || page.url].filter(Boolean),
      discovered_items: items.length,
      candidate_records: counts.processed,
      first_external_id: counts.firstExternalId ?? items[0]?.externalId ?? null,
      last_external_id: counts.lastExternalId ?? items.at(-1)?.externalId ?? null,
      first_published_at: counts.firstPublishedAt ?? items[0]?.publishedAt ?? null,
      last_published_at: counts.lastPublishedAt ?? items.at(-1)?.publishedAt ?? null,
      content_types: counts.contentTypes || {},
      event_split_articles: counts.eventSplitArticles || 0,
      event_split_records: counts.eventSplitRecords || 0,
      added: counts.added,
      updated: counts.updated,
      duplicates: counts.duplicates,
      skipped: counts.skipped,
      parser_warnings: counts.parserWarnings || 0,
      parser_errors: counts.parserErrors,
      http_errors: counts.httpErrors,
      next_page: state.next_page?.index ?? null,
      total_pages: totalPages,
      elapsed_ms: state.last_page_elapsed_ms,
    })}`);
    log(formatBackfillProgress({ sourceId: source.id, state, totalPages, now: now().getTime() }));
    if (state.stop_reason) break;
    page = state.next_page;
  }

  state.completed = ['last-page', 'next-page-missing', 'empty-page'].includes(state.stop_reason);
  state.updated_at = now().toISOString();
  await checkpoint(state);
  return { state, metrics: backfillMetrics(state, now().getTime()), supported: true };
}
