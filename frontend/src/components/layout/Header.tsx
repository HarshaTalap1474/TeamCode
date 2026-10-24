'use client';

import React from 'react';
import { Compass, Database, SlidersHorizontal, MapPin } from 'lucide-react';
import { RetailCategory } from '@/lib/types';

interface HeaderProps {
  category: RetailCategory;
  setCategory: (cat: RetailCategory) => void;
  brand: string;
  setBrand: (b: string) => void;
  city: string;
  setCity: (c: string) => void;
  isLive: boolean;
  onOpenDataCard: () => void;
  onOpenCompare: () => void;
  compareCount: number;
}

const CATEGORY_BRANDS: Record<RetailCategory, string[]> = {
  cafe: ['Starbucks', 'Blue Tokai', 'Third Wave', 'CCD'],
  pharmacy: ['Apollo', 'MedPlus', 'Wellness Forever'],
  supermarket: ['DMart', 'Reliance Smart', "Nature's Basket"],
  qsr: ["McDonald's", "Domino's", 'Burger King'],
  fashion: ['Zudio', 'Westside', 'Decathlon'],
};

export function Header({
  category,
  setCategory,
  brand,
  setBrand,
  city,
  setCity,
  isLive,
  onOpenDataCard,
  onOpenCompare,
  compareCount,
}: HeaderProps) {
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCat = e.target.value as RetailCategory;
    setCategory(newCat);
    const availableBrands = CATEGORY_BRANDS[newCat];
    if (availableBrands && availableBrands.length > 0) {
      setBrand(availableBrands[0]);
    }
  };

  return (
    <header className="h-12 border-b border-[#263244] bg-[#111925] px-4 flex items-center justify-between z-30 sticky top-0 flex-shrink-0">
      {/* Brand Identity */}
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded bg-[#151F2D] border border-[#263244] flex items-center justify-center text-[#4C8DFF]">
          <Compass className="w-3.5 h-3.5" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-semibold tracking-tight text-[#E5EAF1] text-sm">NextWhere</span>
          <span className="text-[10px] font-mono text-[#98A6B8] px-1.5 py-0.2 rounded bg-[#151F2D] border border-[#263244]">
            v2.5
          </span>
        </div>
      </div>

      {/* Structured Filter Toolbar */}
      <div className="hidden sm:flex items-center gap-2">
        {/* City Filter */}
        <div className="flex items-center gap-1 bg-[#151F2D] border border-[#263244] rounded px-2 py-1">
          <MapPin className="w-3 h-3 text-[#4C8DFF]" />
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="bg-transparent text-xs font-medium text-[#E5EAF1] outline-none cursor-pointer"
          >
            <option value="Kolhapur" className="bg-[#111925] text-[#E5EAF1]">Kolhapur (Primary)</option>
            <option value="Pune" className="bg-[#111925] text-[#E5EAF1]">Pune</option>
            <option value="Bangalore" className="bg-[#111925] text-[#E5EAF1]">Bangalore</option>
            <option value="Mumbai" className="bg-[#111925] text-[#E5EAF1]">Mumbai</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-1 bg-[#151F2D] border border-[#263244] rounded px-2 py-1">
          <span className="text-[#64748B] text-[10px] font-medium uppercase tracking-wider">Sector:</span>
          <select
            value={category}
            onChange={handleCategoryChange}
            className="bg-transparent text-xs font-medium text-[#E5EAF1] outline-none cursor-pointer capitalize"
          >
            <option value="cafe" className="bg-[#111925] text-[#E5EAF1]">Cafes & Specialty</option>
            <option value="pharmacy" className="bg-[#111925] text-[#E5EAF1]">Pharmacies</option>
            <option value="supermarket" className="bg-[#111925] text-[#E5EAF1]">Supermarkets</option>
            <option value="qsr" className="bg-[#111925] text-[#E5EAF1]">QSR / Fast Food</option>
            <option value="fashion" className="bg-[#111925] text-[#E5EAF1]">Fashion Retail</option>
          </select>
        </div>

        {/* Brand Filter */}
        <div className="flex items-center gap-1 bg-[#151F2D] border border-[#263244] rounded px-2 py-1">
          <span className="text-[#64748B] text-[10px] font-medium uppercase tracking-wider">Target:</span>
          <select
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="bg-transparent text-xs font-medium text-[#4C8DFF] outline-none cursor-pointer"
          >
            {CATEGORY_BRANDS[category]?.map((b) => (
              <option key={b} value={b} className="bg-[#111925] text-[#E5EAF1]">
                {b}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right Controls & Governance */}
      <div className="flex items-center gap-2.5">
        {/* Compare Trigger */}
        {compareCount > 0 && (
          <button
            onClick={onOpenCompare}
            className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded bg-[#4C8DFF]/15 text-[#4C8DFF] border border-[#4C8DFF]/30 hover:bg-[#4C8DFF]/25 transition"
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>Compare ({compareCount}/2)</span>
          </button>
        )}

        {/* Real Status Indicator */}
        <div
          className="flex items-center gap-1.5 text-[11px] text-[#98A6B8] px-2 py-1 rounded bg-[#151F2D] border border-[#263244]"
          title={isLive ? 'Live FastAPI Backend Connected' : 'Running on Deterministic Local Mock'}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400' : 'bg-slate-400'}`} />
          <span>{isLive ? 'Connected' : 'Offline Cache'}</span>
        </div>

        {/* Data Governance Button */}
        <button
          onClick={onOpenDataCard}
          className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded bg-[#151F2D] hover:bg-[#1C2A3D] text-[#E5EAF1] border border-[#263244] transition"
          title="Data Card & Model Governance"
        >
          <Database className="w-3 h-3 text-[#98A6B8]" />
          <span className="hidden md:inline">Governance</span>
        </button>
      </div>
    </header>
  );
}
