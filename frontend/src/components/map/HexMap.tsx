'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { CandidateSite, POIStore } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface HexMapProps {
  candidates: CandidateSite[];
  pois: POIStore[];
  selectedSite: CandidateSite | null;
  onSelectSite: (site: CandidateSite) => void;
  brand: string;
  city: string;
}

// Dynamically import Leaflet with ssr: false to prevent Next.js server crash
const HexMapDynamic = dynamic(() => import('./HexMapInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#080C14] text-slate-400 gap-3">
      <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
      <span className="text-xs font-medium tracking-wide">Initializing Geospatial Hex Grid...</span>
    </div>
  ),
});

export function HexMap(props: HexMapProps) {
  return <HexMapDynamic {...props} />;
}
