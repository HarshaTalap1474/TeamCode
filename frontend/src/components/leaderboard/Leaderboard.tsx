'use client';

import React, { useState, useMemo } from 'react';
import { CandidateSite, FilterState } from '@/lib/types';
import { CandidateCard } from './CandidateCard';
import { Search, Filter } from 'lucide-react';

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
  city = 'Kolhapur',
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
    <div className="w-full h-full flex flex-col bg-[#111925] overflow-hidden">
      {/* Header & Search */}
      <div className="p-3 border-b border-[#263244] bg-[#0E1520]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#98A6B8]">
            Candidate Ranking Matrix
          </span>
          <span className="text-[10px] font-mono text-[#98A6B8] px-1.5 py-0.2 rounded bg-[#151F2D] border border-[#263244]">
            {filteredCandidates.length} / {candidates.length} Zones
          </span>
        </div>

        {/* Search Input Bar */}
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder={`Filter ${city} zones or cell...`}
            value={filters.searchQuery}
            onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
            className="w-full bg-[#151F2D] border border-[#263244] rounded pl-8 pr-7 py-1 text-xs text-[#E5EAF1] placeholder-[#64748B] focus:outline-none focus:border-[#4C8DFF] transition"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`absolute right-1.5 p-1 rounded hover:bg-[#1C2A3D] transition ${
              showFilters || filters.maxRentIndex < 10 || filters.excludeHighCannibalization
                ? 'text-[#4C8DFF]'
                : 'text-[#64748B]'
            }`}
            title="Toggle constraint filters"
          >
            <Filter className="w-3 h-3" />
          </button>
        </div>

        {/* Expandable Constraint Filters */}
        {showFilters && (
          <div className="mt-2.5 pt-2.5 border-t border-[#263244] space-y-2 text-xs text-[#98A6B8]">
            {/* Rent Index Ceiling Slider */}
            <div>
              <div className="flex justify-between text-[10px] text-[#98A6B8] mb-1">
                <span>Max Rent Ceiling</span>
                <span className="font-mono text-[#E5EAF1]">{filters.maxRentIndex}/10</span>
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
                className="w-full h-1 bg-[#1C2A3D] rounded appearance-none cursor-pointer accent-[#4C8DFF]"
              />
            </div>

            {/* Cannibalization Filter Toggle */}
            <label className="flex items-center gap-2 cursor-pointer pt-0.5 text-[11px]">
              <input
                type="checkbox"
                checked={filters.excludeHighCannibalization}
                onChange={(e) =>
                  setFilters({ ...filters, excludeHighCannibalization: e.target.checked })
                }
                className="rounded border-[#263244] bg-[#151F2D] text-[#4C8DFF] focus:ring-0 w-3.5 h-3.5"
              />
              <span className="text-[#98A6B8]">Exclude high cannibalization (&gt;25%)</span>
            </label>
          </div>
        )}
      </div>

      {/* Column Headers */}
      <div className="flex items-center justify-between px-3 py-1 bg-[#0E1520] border-b border-[#1E293B] text-[10px] font-mono uppercase tracking-wider text-[#64748B]">
        <span>Rank & Zone</span>
        <div className="flex items-center gap-6">
          <span>Net Demand</span>
          <span className="w-12 text-center">Score</span>
        </div>
      </div>

      {/* Candidate Feed */}
      <div className="flex-1 overflow-y-auto">
        {filteredCandidates.length === 0 ? (
          <div className="text-center py-12 text-[#64748B] text-xs">
            <p>No candidate sites match the filter criteria.</p>
            <button
              onClick={() =>
                setFilters({
                  searchQuery: '',
                  maxRentIndex: 10,
                  minPopulation: 0,
                  excludeHighCannibalization: false,
                })
              }
              className="mt-2 text-xs text-[#4C8DFF] hover:underline"
            >
              Reset filters
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

