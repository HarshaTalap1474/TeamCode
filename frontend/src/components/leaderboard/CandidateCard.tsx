'use client';

import React from 'react';
import { CandidateSite } from '@/lib/types';

interface CandidateCardProps {
  site: CandidateSite;
  isSelected: boolean;
  onSelect: () => void;
  isCompared: boolean;
  onToggleCompare: (e: React.MouseEvent) => void;
}

export function CandidateCard({
  site,
  isSelected,
  onSelect,
  isCompared,
  onToggleCompare,
}: CandidateCardProps) {
  const isHighRisk = site.cannibalization_pct > 25 || site.risk_level === 'HIGH';
  const isOptimal = site.eps_score >= 75;

  return (
    <div
      onClick={onSelect}
      className={`group relative flex items-center justify-between px-3 py-2 border-b border-[#1E293B] cursor-pointer transition-colors ${
        isSelected
          ? 'bg-[#151F2D] border-l-[3px] border-l-[#4C8DFF]'
          : 'bg-[#111925] hover:bg-[#151F2D]/60 border-l-[3px] border-l-transparent'
      }`}
    >
      {/* Col 1: Rank & Zone Identifier */}
      <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
        <div
          className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center text-[10px] font-mono font-semibold ${
            isSelected
              ? 'bg-[#4C8DFF]/20 text-[#4C8DFF] border border-[#4C8DFF]/30'
              : 'bg-[#1C2A3D] text-[#98A6B8] border border-[#263244]'
          }`}
        >
          {site.rank}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="text-xs font-medium text-[#E5EAF1] truncate group-hover:text-[#4C8DFF] transition">
              {site.zone_name}
            </h4>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-[#64748B] font-mono mt-0.5">
            <span>{site.h3_id.slice(0, 9)}</span>
            <span>•</span>
            <span>Rent {site.rent_index}/10</span>
          </div>
        </div>
      </div>

      {/* Col 2: Net Incremental Demand & Cannibalization */}
      <div className="text-right flex-shrink-0 mr-3">
        <div className="text-xs font-semibold tabular-nums text-[#22C55E]">
          +{site.net_incremental_demand.toLocaleString()} u
        </div>
        <div
          className={`text-[10px] tabular-nums font-mono mt-0.5 ${
            isHighRisk ? 'text-[#EF4444]' : 'text-[#64748B]'
          }`}
        >
          {site.cannibalization_pct}% cann.
        </div>
      </div>

      {/* Col 3: EPS Metric & Compare Check */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div
          className={`w-12 text-center py-1 rounded text-xs font-mono font-bold tabular-nums border ${
            isOptimal
              ? 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20'
              : isHighRisk
              ? 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20'
              : 'bg-[#151F2D] text-[#E5EAF1] border-[#263244]'
          }`}
          title={`Expansion Priority Score: ${site.eps_score}`}
        >
          {site.eps_score}
        </div>

        <button
          onClick={onToggleCompare}
          className={`px-1.5 py-1 rounded text-[10px] font-mono transition border ${
            isCompared
              ? 'bg-[#4C8DFF]/20 text-[#4C8DFF] border-[#4C8DFF]/40 font-semibold'
              : 'bg-[#151F2D] text-[#64748B] hover:text-[#98A6B8] border-[#263244]'
          }`}
          title={isCompared ? 'Remove from comparison' : 'Add to side-by-side comparison'}
        >
          {isCompared ? '✓' : '+'}
        </button>
      </div>
    </div>
  );
}

