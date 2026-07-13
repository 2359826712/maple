export type ToolEvidenceKind = 'official' | 'community' | 'estimate';
export type ToolFreshness = 'verified' | 'stale' | 'unavailable';

export type ToolProvenance = {
  evidence: ToolEvidenceKind;
  freshness: ToolFreshness;
  evidenceLabelKey:
    | 'tools_evidence_official'
    | 'tools_evidence_community'
    | 'tools_evidence_estimate';
  freshnessLabelKey:
    | 'tools_freshness_verified'
    | 'tools_freshness_stale'
    | 'tools_freshness_unavailable';
};

type ToolProvenanceInput = {
  evidence: ToolEvidenceKind;
  lastCheckedAt?: string | null;
  staleAfterDays?: number;
  now?: Date;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function getToolProvenance({
  evidence,
  lastCheckedAt,
  staleAfterDays = 90,
  now = new Date(),
}: ToolProvenanceInput): ToolProvenance {
  const evidenceLabelKey = {
    official: 'tools_evidence_official',
    community: 'tools_evidence_community',
    estimate: 'tools_evidence_estimate',
  }[evidence] as ToolProvenance['evidenceLabelKey'];

  const checkedAt = lastCheckedAt ? new Date(lastCheckedAt) : null;
  const checkedTime = checkedAt?.getTime();
  let freshness: ToolFreshness = 'unavailable';

  if (checkedTime !== undefined && Number.isFinite(checkedTime)) {
    const ageDays = Math.max(0, now.getTime() - checkedTime) / DAY_MS;
    freshness = ageDays > staleAfterDays ? 'stale' : 'verified';
  }

  const freshnessLabelKey = {
    verified: 'tools_freshness_verified',
    stale: 'tools_freshness_stale',
    unavailable: 'tools_freshness_unavailable',
  }[freshness] as ToolProvenance['freshnessLabelKey'];

  return { evidence, freshness, evidenceLabelKey, freshnessLabelKey };
}
