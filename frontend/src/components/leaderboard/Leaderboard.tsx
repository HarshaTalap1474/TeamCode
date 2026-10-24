'use client';

import React, { useState, useMemo } from 'react';
import { CandidateSite, FilterState } from '@/lib/types';
import { CandidateCard } from './CandidateCard';
import { Search, Sliders, Filter, Sparkles } from 'lucide-react';

interface LeaderboardProps {
  candidates: CandidateSite[];
  selectedSite: CandidateSite | null;
  onSelectSite: (site: CandidateSite) => void;
  comparedSites: CandidateSite[];
  onToggleCompare: (site: CandidateSite) => void;
  brand: string;
  city?: string;
}

export function Leaderboard({
  candidates,
  selectedSite,
  onSelectSite,
  comparedSites,
  onToggleCompare,
  brand,
  city = 'Pune',
}: LeaderboardProps) {
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    maxRentIndex: 10,
    minPopulation: 0,
    excludeHighCannibalization: false,
  });

  const [showFilters, setShowFilters] = useState(false);

  // Filter candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter((site) => {
      // Search query
      if (
        filters.searchQuery &&
        !site.zone_name.toLowerCase().includes(filters.searchQuery.toLowerCase()) &&
        !site.h3_id.toLowerCase().includes(filters.searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Max Rent
      if (site.rent_index > filters.maxRentIndex) {
        return false;
      }

      // Exclude high cannibalization
      if (filters.excludeHighCannibalization && site.cannibalization_pct > 25) {
        return false;
      }

      return true;
    });
  }, [candidates, filters]);

  return (
    <div className="w-full h-full flex flex-col bg-[#0B0F19] overflow-hidden">
      {/* Header & Search */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-900/40">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100 tracking-tight">Candidate Leaderboard</h3>
          </div>
          <span className="text-[11px] font-mono font-medium text-slate-400 px-2 py-0.5 rounded bg-slate-800 border border-slate-700/60">
            {filteredCandidates.length} of {candidates.length} Sites
          </span>
        </div>

        {/* Search Input Bar */}
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder={`Search ${city} zone or cell ID...`}
            value={filters.searchQuery}
            onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-md pl-9 pr-8 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`absolute right-2 p-1 rounded hover:bg-slate-800 transition ${
              showFilters || filters.maxRentIndex < 10 || filters.excludeHighCannibalization
                ? 'text-blue-400'
                : 'text-slate-400'
            }`}
            title="Toggle constraint filters"
          >
            <Filter className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Expandable Constraint Filters */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2.5 text-xs text-slate-300">
            {/* Rent Index Ceiling Slider */}
            <div>
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Max Rent Ceiling</span>
                <span className="font-mono text-slate-200">{filters.maxRentIndex}/10</span>
              </div>
              <input
                type="range"
                min="3"
                max="10"
                step="0.5"
                value={filters.maxRentIndex}
                onChange={(e) =>
                  setFilters({ ...filters, maxRentIndex: parseFloat(e.target.value) })
                }
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            {/* Cannibalization Filter Toggle */}
            <label className="flex items-center gap-2 cursor-pointer pt-1 text-[11px]">
              <input
                type="checkbox"
                checked={filters.excludeHighCannibalization}
                onChange={(e) =>
                  setFilters({ ...filters, excludeHighCannibalization: e.target.checked })
                }
                className="rounded border-slate-700 bg-slate-900 text-blue-500 focus:ring-0 w-3.5 h-3.5"
              />
              <span className="text-slate-300">Exclude High Cannibalization (&gt;25%)</span>
            </label>
          </div>
        )}
      </div>

      {/* Candidate Cards Scrollable Feed */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
        {filteredCandidates.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            <p>No candidates match your current filter parameters.</p>
            <button
              onClick={() =>
                setFilters({
                  searchQuery: '',
                  maxRentIndex: 10,
                  minPopulation: 0,
                  excludeHighCannibalization: false,
                })
              }
              className="mt-3 text-blue-400 hover:underline"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredCandidates.map((site) => (
            <CandidateCard
              key={site.h3_id}
              site={site}
              isSelected={selectedSite?.h3_id === site.h3_id}
              onSelect={() => onSelectSite(site)}
              isCompared={comparedSites.some((s) => s.h3_id === site.h3_id)}
              onToggleCompare={(e) => {
                e.stopPropagation();
                onToggleCompare(site);
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}
