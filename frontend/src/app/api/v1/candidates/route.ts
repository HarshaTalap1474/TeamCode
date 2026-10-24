import { NextRequest, NextResponse } from 'next/server';
import mockCandidates from '@/mock/candidates.json';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get('category') || 'cafe';
  const brand = searchParams.get('brand') || 'Starbucks';

  // If BACKEND_URL is set, forward to real FastAPI backend
  if (process.env.BACKEND_URL) {
    try {
      const res = await fetch(
        `${process.env.BACKEND_URL}/v1/candidates?category=${category}&brand=${brand}`,
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

  // Filter mock candidates by category and brand (or return all for that category)
  const filtered = mockCandidates.filter((c) => c.category === category);
  const data = filtered.length > 0 ? filtered : mockCandidates;

  return NextResponse.json(data);
}
