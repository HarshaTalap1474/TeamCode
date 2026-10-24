import { NextRequest, NextResponse } from 'next/server';
import mockPOIs from '@/mock/pois.json';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get('category') || 'cafe';

  if (process.env.BACKEND_URL) {
    try {
      const res = await fetch(
        `${process.env.BACKEND_URL}/v1/pois?category=${category}`,
        { cache: 'no-store' }
      );
      if (res.ok) {
        const data = await res.json();
        return NextResponse.json(data);
      }
    } catch {
      // fallback
    }
  }

  const filtered = mockPOIs.filter((p) => p.category === category);
  return NextResponse.json(filtered.length > 0 ? filtered : mockPOIs);
}
