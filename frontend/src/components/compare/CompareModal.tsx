'use client';

import React from 'react';
import { CandidateSite } from '@/lib/types';
import { X } from 'lucide-react';

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
      <div className="bg-[#111925] border border-[#263244] rounded-lg max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-3.5 border-b border-[#263244] flex items-center justify-between bg-[#0E1520]">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[#E5EAF1]">Site Comparison Matrix</h3>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#151F2D] text-[#4C8DFF] border border-[#263244]">
                {brand}
              </span>
            </div>
            <p className="text-[11px] text-[#98A6B8] mt-0.5">
              Side-by-side comparative evaluation of shortlisted candidate locations
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded bg-[#151F2D] text-[#98A6B8] hover:text-[#E5EAF1] border border-[#263244] transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto space-y-4">
          {sites.length < 2 ? (
            <div className="text-center py-10 text-[#64748B] text-xs">
              <p>Please select 2 candidate sites from the ranking list to run a side-by-side comparison.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {/* Site A Card */}
              <div className="p-3.5 rounded bg-[#151F2D] border border-[#263244] space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-[#4C8DFF] font-semibold uppercase tracking-wider">
                      Option A (Rank #{siteA.rank})
                    </span>
                    <h4 className="text-xs font-semibold text-[#E5EAF1] mt-0.5">{siteA.zone_name}</h4>
                  </div>
                  <div className="px-2 py-0.5 rounded bg-[#1C2A3D] text-[#E5EAF1] border border-[#263244] font-mono font-bold text-xs tabular-nums">
                    EPS {siteA.eps_score}
                  </div>
                </div>

                <div className="space-y-1.5 text-xs border-y border-[#263244] py-2.5 font-mono">
                  <div className="flex justify-between text-[#98A6B8]">
                    <span className="font-sans">Net Incremental Demand:</span>
                    <span className="font-bold tabular-nums text-[#22C55E]">
                      +{siteA.net_incremental_demand.toLocaleString()} u
                    </span>
                  </div>
                  <div className="flex justify-between text-[#98A6B8]">
                    <span className="font-sans">Gross Capture:</span>
                    <span className="tabular-nums text-[#E5EAF1]">{siteA.demand_capture.toLocaleString()} u</span>
                  </div>
                  <div className="flex justify-between text-[#98A6B8]">
                    <span className="font-sans">Cannibalization:</span>
                    <span className={`tabular-nums ${siteA.cannibalization_pct > 25 ? 'text-[#EF4444] font-semibold' : 'text-[#98A6B8]'}`}>
                      {siteA.cannibalization_pct}% (-{siteA.cannibalization_units} u)
                    </span>
                  </div>
                  <div className="flex justify-between text-[#98A6B8]">
                    <span className="font-sans">Rent Pressure Index:</span>
                    <span className="tabular-nums text-[#E5EAF1]">{siteA.rent_index}/10</span>
                  </div>
                  <div className="flex justify-between text-[#98A6B8]">
                    <span className="font-sans">Coverage Ratio:</span>
                    <span className="tabular-nums text-[#E5EAF1]">{siteA.coverage_ratio}x</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#98A6B8] block font-mono mb-1">
                    Primary Driver
                  </span>
                  <div className="text-xs text-[#4C8DFF] font-medium bg-[#111925] p-2 rounded border border-[#263244]">
                    {siteA.shap_drivers[0]?.feature || 'High Demand Density'}
                  </div>
                </div>
              </div>

              {/* Site B Card */}
              <div className="p-3.5 rounded bg-[#151F2D] border border-[#263244] space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-[#98A6B8] font-semibold uppercase tracking-wider">
                      Option B (Rank #{siteB.rank})
                    </span>
                    <h4 className="text-xs font-semibold text-[#E5EAF1] mt-0.5">{siteB.zone_name}</h4>
                  </div>
                  <div className="px-2 py-0.5 rounded bg-[#1C2A3D] text-[#E5EAF1] border border-[#263244] font-mono font-bold text-xs tabular-nums">
                    EPS {siteB.eps_score}
                  </div>
                </div>

                <div className="space-y-1.5 text-xs border-y border-[#263244] py-2.5 font-mono">
                  <div className="flex justify-between text-[#98A6B8]">
                    <span className="font-sans">Net Incremental Demand:</span>
                    <span className="font-bold tabular-nums text-[#22C55E]">
                      +{siteB.net_incremental_demand.toLocaleString()} u
                    </span>
                  </div>
                  <div className="flex justify-between text-[#98A6B8]">
                    <span className="font-sans">Gross Capture:</span>
                    <span className="tabular-nums text-[#E5EAF1]">{siteB.demand_capture.toLocaleString()} u</span>
                  </div>
                  <div className="flex justify-between text-[#98A6B8]">
                    <span className="font-sans">Cannibalization:</span>
                    <span className={`tabular-nums ${siteB.cannibalization_pct > 25 ? 'text-[#EF4444] font-semibold' : 'text-[#98A6B8]'}`}>
                      {siteB.cannibalization_pct}% (-{siteB.cannibalization_units} u)
                    </span>
                  </div>
                  <div className="flex justify-between text-[#98A6B8]">
                    <span className="font-sans">Rent Pressure Index:</span>
                    <span className="tabular-nums text-[#E5EAF1]">{siteB.rent_index}/10</span>
                  </div>
                  <div className="flex justify-between text-[#98A6B8]">
                    <span className="font-sans">Coverage Ratio:</span>
                    <span className="tabular-nums text-[#E5EAF1]">{siteB.coverage_ratio}x</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#98A6B8] block font-mono mb-1">
                    Primary Driver
                  </span>
                  <div className="text-xs text-[#4C8DFF] font-medium bg-[#111925] p-2 rounded border border-[#263244]">
                    {siteB.shap_drivers[0]?.feature || 'Favorable Demographics'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#263244] bg-[#0E1520] flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-[#151F2D] hover:bg-[#1C2A3D] text-[#E5EAF1] text-xs font-medium border border-[#263244] transition"
          >
            Close Matrix
          </button>
        </div>
      </div>
    </div>
  );
}

