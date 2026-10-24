import { CandidateSite, POIStore, RetailCategory } from './types';
import mockCandidates from '../mock/candidates.json';
import mockPOIs from '../mock/pois.json';

/**
 * Fetches candidate sites with fallback to mock data
 */
export async function fetchCandidates(
  category: RetailCategory = 'cafe',
  brand = 'Starbucks'
): Promise<{ data: CandidateSite[]; isLive: boolean }> {
  try {
    const res = await fetch(`/api/v1/candidates?category=${category}&brand=${brand}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { data, isLive: Boolean(process.env.BACKEND_URL) };
  } catch {
    const filtered = (mockCandidates as CandidateSite[]).filter(
      (c) => c.category === category
    );
    const finalData = filtered.length > 0 ? filtered : (mockCandidates as CandidateSite[]);
    return { data: finalData, isLive: false };
  }
}

/**
 * Fetches competitor and brand POIs with fallback to local mock data
 */
export async function fetchPOIs(
  category: RetailCategory = 'cafe'
): Promise<POIStore[]> {
  try {
    const res = await fetch(`/api/v1/pois?category=${category}`);
    if (!res.ok) throw new Error('POI API unavailable');
    return await res.json();
  } catch {
    return (mockPOIs as POIStore[]).filter((p) => p.category === category);
  }
}
