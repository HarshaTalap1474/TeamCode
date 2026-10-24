import { NextRequest, NextResponse } from 'next/server';
import mockCandidates from '@/mock/candidates.json';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get('category') || 'cafe';
  const brand = searchParams.get('brand') || 'Starbucks';
  const city = searchParams.get('city') || 'Kolhapur';

  // If BACKEND_URL is set, forward to real FastAPI backend
  if (process.env.BACKEND_URL) {
    try {
      const res = await fetch(
        `${process.env.BACKEND_URL}/v1/candidates?category=${category}&brand=${brand}&city=${city}`,
        { cache: 'no-store' }
      );
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // fallback to mock on backend error
    }
  }

  // Filter mock candidates by category and city
  const cityFiltered = mockCandidates.filter(
    (c) => !c.city || c.city.toLowerCase() === city.toLowerCase()
  );
  const filtered = cityFiltered.filter((c) => c.category === category);
  const data = filtered.length > 0 ? filtered : (cityFiltered.length > 0 ? cityFiltered : mockCandidates);

  return NextResponse.json(data);
}
