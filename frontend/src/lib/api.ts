import { CandidateSite, POIStore, RetailCategory } from './types';
import mockCandidates from '../mock/candidates.json';
import mockPOIs from '../mock/pois.json';

/**
 * Fetches candidate sites with fallback to mock data
 */
export async function fetchCandidates(
  category: RetailCategory = 'cafe',
  brand = 'Starbucks',
  city = 'Pune'
): Promise<{ data: CandidateSite[]; isLive: boolean }> {
  try {
    const res = await fetch(`/api/v1/candidates?category=${category}&brand=${brand}&city=${city}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { data, isLive: Boolean(process.env.BACKEND_URL) };
  } catch {
    const filtered = (mockCandidates as CandidateSite[]).filter(
      (c) =>
        c.category === category &&
        (!c.city || c.city.toLowerCase() === city.toLowerCase())
    );
    const fallbackCity = (mockCandidates as CandidateSite[]).filter(
      (c) => !c.city || c.city.toLowerCase() === city.toLowerCase()
    );
    const finalData = filtered.length > 0 ? filtered : (fallbackCity.length > 0 ? fallbackCity : (mockCandidates as CandidateSite[]));
    return { data: finalData, isLive: false };
  }
}

/**
 * Fetches competitor and brand POIs with fallback to local mock data
 */
export async function fetchPOIs(
  category: RetailCategory = 'cafe',
  city = 'Pune'
): Promise<POIStore[]> {
  try {
    const res = await fetch(`/api/v1/pois?category=${category}&city=${city}`);
    if (!res.ok) throw new Error('POI API unavailable');
    return await res.json();
  } catch {
    const filtered = (mockPOIs as POIStore[]).filter(
      (p) =>
        p.category === category &&
        (!p.city || p.city.toLowerCase() === city.toLowerCase())
    );
    const fallbackCity = (mockPOIs as POIStore[]).filter(
      (p) => !p.city || p.city.toLowerCase() === city.toLowerCase()
    );
    return filtered.length > 0 ? filtered : fallbackCity;
  }
}
