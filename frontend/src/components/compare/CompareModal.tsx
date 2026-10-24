'use client';

import React from 'react';
import { CandidateSite } from '@/lib/types';
import { X, ArrowRight, TrendingUp, AlertTriangle, CheckCircle, DollarSign } from 'lucide-react';

interface CompareModalProps {
  sites: CandidateSite[];
  isOpen: boolean;
  onClose: () => void;
  brand: string;
}

export function CompareModal({ sites, isOpen, onClose, brand }: CompareModalProps) {
  if (!isOpen || sites.length === 0) return null;

  const [siteA, siteB] = sites;

  return (
    <div className="fixed inset-0 z-[2000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0E1424] border border-slate-800 rounded-xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>Site Comparison Matrix</span>
              <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                {brand}
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Side-by-side contrastive analysis of candidate expansion locations
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {sites.length < 2 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              <p>Please select 2 candidate sites from the leaderboard to run a side-by-side comparison.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {/* Site A Card */}
              <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-blue-400 font-bold uppercase tracking-wider">
                      Option A (Rank #{siteA.rank})
                    </span>
                    <h4 className="text-base font-bold text-slate-100 mt-0.5">{siteA.zone_name}</h4>
                  </div>
                  <div className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono font-bold text-xs">
                    EPS {siteA.eps_score}
                  </div>
                </div>

                <div className="space-y-2 text-xs border-y border-slate-800 py-3">
                  <div className="flex justify-between text-slate-300">
                    <span>Net Incremental Demand:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {siteA.net_incremental_demand.toLocaleString()} units
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Gross Capture:</span>
                    <span className="font-mono">{siteA.demand_capture.toLocaleString()} u</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Cannibalization:</span>
                    <span className={`font-mono ${siteA.cannibalization_pct > 25 ? 'text-red-400 font-bold' : ''}`}>
                      {siteA.cannibalization_pct}% ({siteA.cannibalization_units} u)
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Rent Pressure Index:</span>
                    <span className="font-mono">{siteA.rent_index}/10</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Coverage Ratio:</span>
                    <span className="font-mono">{siteA.coverage_ratio}x</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold mb-1">
                    Top Positive Driver
                  </span>
                  <div className="text-xs text-emerald-400 font-medium bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                    {siteA.shap_drivers[0]?.feature || 'High Demand Density'}
                  </div>
                </div>
              </div>

              {/* Site B Card */}
              <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-wider">
                      Option B (Rank #{siteB.rank})
                    </span>
                    <h4 className="text-base font-bold text-slate-100 mt-0.5">{siteB.zone_name}</h4>
                  </div>
                  <div className="px-2 py-1 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono font-bold text-xs">
                    EPS {siteB.eps_score}
                  </div>
                </div>

                <div className="space-y-2 text-xs border-y border-slate-800 py-3">
                  <div className="flex justify-between text-slate-300">
                    <span>Net Incremental Demand:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {siteB.net_incremental_demand.toLocaleString()} units
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Gross Capture:</span>
                    <span className="font-mono">{siteB.demand_capture.toLocaleString()} u</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Cannibalization:</span>
                    <span className={`font-mono ${siteB.cannibalization_pct > 25 ? 'text-red-400 font-bold' : ''}`}>
                      {siteB.cannibalization_pct}% ({siteB.cannibalization_units} u)
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Rent Pressure Index:</span>
                    <span className="font-mono">{siteB.rent_index}/10</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Coverage Ratio:</span>
                    <span className="font-mono">{siteB.coverage_ratio}x</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold mb-1">
                    Top Positive Driver
                  </span>
                  <div className="text-xs text-purple-400 font-medium bg-purple-500/10 p-2 rounded border border-purple-500/20">
                    {siteB.shap_drivers[0]?.feature || 'Favorable Demographics'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
}
