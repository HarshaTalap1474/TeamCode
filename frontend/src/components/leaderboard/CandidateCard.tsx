'use client';

import React from 'react';
import { CandidateSite } from '@/lib/types';
import { ArrowUpRight, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';

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
  const isHighRisk = site.cannibalization_pct > 30 || site.risk_level === 'HIGH';
  const isModerate = site.eps_score >= 50 && site.eps_score < 75;

  let badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  if (isHighRisk) {
    badgeColor = 'bg-red-500/10 text-red-400 border-red-500/20';
  } else if (isModerate) {
    badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  }

  return (
    <div
      onClick={onSelect}
      className={`relative p-3.5 rounded-lg border transition-all cursor-pointer group ${
        isSelected
          ? 'bg-slate-800/95 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/50'
          : 'bg-slate-900/70 hover:bg-slate-850 border-slate-800/80 hover:border-slate-700'
      }`}
    >
      {/* Top Header: Rank & Name */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-slate-800 border border-slate-700/80 flex items-center justify-center text-xs font-mono font-bold text-slate-300">
            #{site.rank}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-100 group-hover:text-blue-400 transition leading-tight">
              {site.zone_name}
            </h4>
            <span className="text-[10px] font-mono text-slate-500">{site.h3_id.slice(0, 10)}...</span>
          </div>
        </div>

        {/* Master EPS Badge */}
        <div className={`px-2 py-1 rounded border text-xs font-bold font-mono ${badgeColor}`}>
          EPS {site.eps_score}
        </div>
      </div>

      {/* Core Demand Arithmetic */}
      <div className="grid grid-cols-2 gap-2 my-2 py-2 border-y border-slate-800/60 text-xs">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-medium">Net Incremental Demand</span>
          <div className="flex items-center gap-1 font-semibold text-slate-100 mt-0.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>{site.net_incremental_demand.toLocaleString()} units</span>
          </div>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-medium">Cannibalization</span>
          <div className="flex items-center gap-1 font-semibold text-slate-100 mt-0.5">
            {site.cannibalization_pct > 20 && (
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            )}
            <span className={site.cannibalization_pct > 25 ? 'text-red-400' : 'text-slate-300'}>
              {site.cannibalization_pct}% ({site.cannibalization_units} u)
            </span>
          </div>
        </div>
      </div>

      {/* Footer Tags & Compare Button */}
      <div className="flex items-center justify-between gap-2 mt-2.5">
        <div className="flex flex-wrap gap-1">
          {site.flags.slice(0, 2).map((flag) => (
            <span
              key={flag}
              className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/50"
            >
              {flag}
            </span>
          ))}
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-800/60 text-slate-400 border border-slate-800 flex items-center gap-0.5">
            <DollarSign className="w-2.5 h-2.5" />
            Rent {site.rent_index}/10
          </span>
        </div>

        {/* Compare Checkbox */}
        <button
          onClick={onToggleCompare}
          className={`text-[10px] font-semibold px-2 py-1 rounded transition border ${
            isCompared
              ? 'bg-blue-600 text-white border-blue-500'
              : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700/70'
          }`}
          title="Select to compare side-by-side"
        >
          {isCompared ? '✓ Selected' : '+ Compare'}
        </button>
      </div>
    </div>
  );
}
