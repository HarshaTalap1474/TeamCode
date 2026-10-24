---
paths:
  - "frontend/**/*.tsx"
  - "frontend/**/*.ts"
  - "frontend/**/*.jsx"
  - "frontend/**/*.js"
  - "frontend/next.config.*"
---
# Next.js & Geospatial Web Patterns

Use these rules for the NextWhere frontend application alongside the general web design rules.

## 1. Geospatial Map SSR Boundaries (`ssr: false`)

Map libraries (Leaflet, MapLibre GL, deck.gl, Mapbox) rely on browser globals (`window`, `document`, WebGL context). If rendered on the server during Next.js SSR, they will crash with `ReferenceError: window is not defined`.

**Mandatory Pattern**:
- Mark the map component with `'use client'`.
- Always load map components in pages using `next/dynamic` with `{ ssr: false }`:

```tsx
// frontend/src/components/map/HexMapWrapper.tsx
'use client';
import dynamic from 'next/dynamic';

export const HexMap = dynamic(
  () => import('./HexMapInner'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-slate-950 text-slate-400">
        <span className="animate-pulse">Loading Geospatial Hex Map...</span>
      </div>
    ),
  }
);
```

---

## 2. API Proxy Rewrites to FastAPI Backend

Do not hardcode backend ports or fight CORS during development. In `frontend/next.config.mjs`, proxy all API requests:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: process.env.BACKEND_URL 
          ? `${process.env.BACKEND_URL}/v1/:path*` 
          : 'http://127.0.0.1:8000/v1/:path*',
      },
    ];
  },
};
export default nextConfig;
```

---

## 3. Graceful Mock Data Fallback (Never-Fail Demo)

During hackathon presentations, network blips or backend crashes can happen. Always wrap API calls with a local mock fallback:

```typescript
import mockData from '@/mock/candidates.json';

export async function fetchCandidates(category = 'cafe', brand = 'Starbucks') {
  try {
    const res = await fetch(`/api/v1/candidates?category=${category}&brand=${brand}`);
    if (!res.ok) throw new Error('Backend offline');
    return await res.json();
  } catch (err) {
    console.warn('Backend unavailable, using local mock data fallback:', err);
    return mockData;
  }
}
```

---

## 4. State Separation

- **URL Search Params**: Store `category`, `brand`, and `selected_h3` in the URL query string so views are bookmarkable and shareable during the demo.
- **Client State**: Use lightweight React state or Zustand for map viewports, active filter sliders, and drawer toggles.
