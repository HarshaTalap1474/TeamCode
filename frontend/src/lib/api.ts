import { CandidateSite, POIStore, RetailCategory } from './types';
import mockCandidates from '../mock/candidates.json';
import mockPOIs from '../mock/pois.json';

/**
 * Fetches candidate sites with silent fallback to high-quality mock data
 * ensuring the UI never fails during live presentations.
 */
export async function fetchCandidates(
  category: RetailCategory = 'cafe',
  brand = 'Starbucks'
): Promise<{ data: CandidateSite[]; isLive: boolean }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200); // 1.2s timeout

    const res = await fetch(`/api/v1/candidates?category=${category}&brand=${brand}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`Backend returned HTTP ${res.status}`);
    const data = await res.json();
    return { data, isLive: true };
  } catch {
    // Graceful fallback to category-filtered mock data
    const filtered = (mockCandidates as CandidateSite[]).filter(
      (c) => c.category === category
    );

    // If no exact category matches, return all cafes
    const finalData = filtered.length > 0 ? filtered : (mockCandidates as CandidateSite[]);
    return { data: finalData, isLive: false };
  }
}

/**
 * Fetches competitor and brand POIs with fallback to local mock data.
 */
export async function fetchPOIs(
  category: RetailCategory = 'cafe'
): Promise<POIStore[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);

    const res = await fetch(`/api/v1/pois?category=${category}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error('POI API unavailable');
    return await res.json();
  } catch {
    return (mockPOIs as POIStore[]).filter((p) => p.category === category);
  }
}
