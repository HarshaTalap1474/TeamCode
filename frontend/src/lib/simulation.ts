import { CandidateSite, SimulationWeights } from './types';

/**
 * Re-scores and re-ranks candidate sites client-side in under 10ms
 * using the NextWhere Expansion Priority Score (EPS) formula.
 */
export function recalculateCandidates(
  candidates: CandidateSite[],
  weights: SimulationWeights
): CandidateSite[] {
  if (!candidates || candidates.length === 0) return [];

  // Normalize weights so they sum to 1.0
  const totalWeight = weights.demand + weights.pattern + weights.rent;
  const wD = weights.demand / (totalWeight || 1);
  const wP = weights.pattern / (totalWeight || 1);
  const wR = weights.rent / (totalWeight || 1);

  // Find min and max for scaling
  const maxNID = Math.max(...candidates.map((c) => c.net_incremental_demand), 1);
  const minNID = Math.min(...candidates.map((c) => c.net_incremental_demand), 0);

  const updated = candidates.map((site) => {
    // Demand percentile (0 to 100)
    const demandScore =
      maxNID === minNID
        ? 75
        : ((site.net_incremental_demand - minNID) / (maxNID - minNID)) * 100;

    // Pattern score (already 0 to 100)
    const patternScore = site.pattern_score;

    // Affordability score (invert rent index 1-10: 10 is expensive, 1 is affordable)
    const affordabilityScore = Math.max(0, (10 - site.rent_index) * 10);

    // Master EPS fusion (0 to 100)
    const rawEPS = wD * demandScore + wP * patternScore + wR * affordabilityScore;
    const epsScore = Number(Math.min(99.9, Math.max(15.0, rawEPS)).toFixed(1));

    // Dynamic risk assessment based on cannibalization and rent
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = site.risk_level;
    if (site.cannibalization_pct > 30) {
      riskLevel = 'HIGH';
    } else if (site.cannibalization_pct > 18 || site.rent_index > 8.5) {
      riskLevel = 'MEDIUM';
    } else {
      riskLevel = 'LOW';
    }

    return {
      ...site,
      eps_score: epsScore,
      risk_level: riskLevel,
    };
  });

  // Sort descending by new EPS score and assign new ranks
  updated.sort((a, b) => b.eps_score - a.eps_score);

  return updated.map((site, index) => ({
    ...site,
    rank: index + 1,
  }));
}
