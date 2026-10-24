'use client';

import React from 'react';
import { Compass, Database, CheckCircle2, SlidersHorizontal, MapPin } from 'lucide-react';
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
    <header className="h-16 border-b border-slate-800 bg-[#0B0F19]/95 backdrop-blur-md px-5 flex items-center justify-between z-20 sticky top-0">
      {/* Brand & Platform Identity */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
          <Compass className="w-5 h-5 animate-spin-slow" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-tight text-slate-100 text-lg">NextWhere</span>
            <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Intelligence v2.5
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Retail Spatial Demand & Cannibalization Analysis</p>
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="hidden md:flex items-center gap-2.5 bg-slate-900/90 border border-slate-800/90 p-1.5 rounded-lg">
        {/* City Selector */}
        <div className="flex items-center gap-1.5 px-2 py-1 text-xs text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-blue-400" />
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="bg-transparent font-medium text-slate-200 outline-none cursor-pointer"
          >
            <option value="Pune" className="bg-slate-900 text-slate-200">Pune (Primary)</option>
            <option value="Kolhapur" className="bg-slate-900 text-slate-200">Kolhapur</option>
            <option value="Bangalore" className="bg-slate-900 text-slate-200">Bangalore</option>
            <option value="Mumbai" className="bg-slate-900 text-slate-200">Mumbai</option>
          </select>
        </div>

        <div className="w-px h-4 bg-slate-800" />

        {/* Category Selector */}
        <div className="flex items-center gap-1.5 px-2 py-1 text-xs text-slate-300">
          <span className="text-slate-500 font-mono text-[11px]">CAT:</span>
          <select
            value={category}
            onChange={handleCategoryChange}
            className="bg-transparent font-medium text-slate-200 outline-none cursor-pointer capitalize"
          >
            <option value="cafe" className="bg-slate-900 text-slate-200">☕ Cafes & Coffee</option>
            <option value="pharmacy" className="bg-slate-900 text-slate-200">💊 Pharmacies</option>
            <option value="supermarket" className="bg-slate-900 text-slate-200">🛒 Supermarkets</option>
            <option value="qsr" className="bg-slate-900 text-slate-200">🍔 QSR & Fast Food</option>
            <option value="fashion" className="bg-slate-900 text-slate-200">👕 Fashion Retail</option>
          </select>
        </div>

        <div className="w-px h-4 bg-slate-800" />

        {/* Brand Selector */}
        <div className="flex items-center gap-1.5 px-2 py-1 text-xs text-slate-300">
          <span className="text-slate-500 font-mono text-[11px]">BRAND:</span>
          <select
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="bg-transparent font-semibold text-emerald-400 outline-none cursor-pointer"
          >
            {CATEGORY_BRANDS[category]?.map((b) => (
              <option key={b} value={b} className="bg-slate-900 text-slate-200">
                {b}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right Controls & Governance */}
      <div className="flex items-center gap-3">
        {/* Compare Trigger Button */}
        {compareCount > 0 && (
          <button
            onClick={onOpenCompare}
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white transition shadow-sm animate-pulse"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Compare ({compareCount}/2)</span>
          </button>
        )}

        {/* Live / Mock Status Pill */}
        <div
          className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border ${
            isLive
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-slate-800/60 text-slate-300 border-slate-700/50'
          }`}
          title={isLive ? 'Connected directly to live FastAPI backend' : 'Running on fast deterministic local cache'}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isLive ? 'bg-emerald-400 animate-ping' : 'bg-blue-400'
            }`}
          />
          <span>{isLive ? 'FastAPI Connected' : 'Offline Cache Mode'}</span>
        </div>

        {/* Data Card Button */}
        <button
          onClick={onOpenDataCard}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 transition"
        >
          <Database className="w-3.5 h-3.5 text-slate-400" />
          <span>Data Governance</span>
        </button>
      </div>
    </header>
  );
}
