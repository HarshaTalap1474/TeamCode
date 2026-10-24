'use client';

import React from 'react';
import { CandidateSite } from '@/lib/types';
import { SHAPBarChart } from './SHAPBarChart';
import { X } from 'lucide-react';

interface SiteBriefDrawerProps {
  site: CandidateSite | null;
  onClose: () => void;
  brand: string;
}

export function SiteBriefDrawer({ site, onClose, brand }: SiteBriefDrawerProps) {
  if (!site) return null;

  const isHighRisk = site.cannibalization_pct > 25 || site.risk_level === 'HIGH';

  return (
    <div className="w-full h-full bg-[#111925] flex flex-col overflow-hidden">
      {/* Sub-Header */}
      <div className="p-3 border-b border-[#263244] bg-[#0E1520] flex items-center justify-between flex-shrink-0">
        <div className="min-w-0 pr-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-[#4C8DFF]/15 text-[#4C8DFF] border border-[#4C8DFF]/30">
              Rank #{site.rank}
            </span>
            <span className="text-[10px] font-mono text-[#64748B]">
              Cell: {site.h3_id.slice(0, 11)}
            </span>
          </div>
          <h2 className="text-xs font-semibold text-[#E5EAF1] truncate mt-0.5">{site.zone_name}</h2>
          <div className="text-[10px] text-[#98A6B8] mt-0.5">
            Targeting {brand} • {site.city || 'Regional'}
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded text-[#98A6B8] hover:text-[#E5EAF1] bg-[#151F2D] hover:bg-[#1C2A3D] transition border border-[#263244] flex-shrink-0"
          title="Close Site Dossier"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body Scroll */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* 4-KPI Executive Summary Strip */}
        <div className="grid grid-cols-2 gap-2">
          {/* EPS Score */}
          <div className="p-2.5 rounded bg-[#151F2D] border border-[#263244]">
            <div className="flex items-center justify-between text-[10px] text-[#98A6B8]">
              <span>Expansion Priority</span>
              <span
                className={`px-1 py-0.2 rounded text-[9px] font-mono font-semibold border ${
                  isHighRisk
                    ? 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20'
                    : site.eps_score >= 75
                    ? 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20'
                    : 'bg-[#1C2A3D] text-[#98A6B8] border-[#263244]'
                }`}
              >
                {site.risk_level}
              </span>
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-mono font-bold tabular-nums text-[#E5EAF1]">
                {site.eps_score}
              </span>
              <span className="text-[10px] text-[#64748B] font-mono">/ 100</span>
            </div>
          </div>

          {/* Net Incremental Demand */}
          <div className="p-2.5 rounded bg-[#151F2D] border border-[#263244]">
            <div className="text-[10px] text-[#98A6B8]">Net Incremental</div>
            <div className="text-xl font-mono font-bold tabular-nums text-[#22C55E] mt-1">
              +{site.net_incremental_demand.toLocaleString()}
            </div>
            <div className="text-[9px] text-[#64748B] font-mono mt-0.5">ann. units</div>
          </div>

          {/* Gross Capture */}
          <div className="p-2.5 rounded bg-[#151F2D] border border-[#263244]">
            <div className="text-[10px] text-[#98A6B8]">Gross Capture</div>
            <div className="text-sm font-mono font-semibold tabular-nums text-[#E5EAF1] mt-1">
              {site.demand_capture.toLocaleString()} u
            </div>
            <div className="text-[9px] text-[#64748B] font-mono mt-0.5">Huff gravity model</div>
          </div>

          {/* Cannibalization */}
          <div className="p-2.5 rounded bg-[#151F2D] border border-[#263244]">
            <div className="text-[10px] text-[#98A6B8]">Cannibalization</div>
            <div
              className={`text-sm font-mono font-semibold tabular-nums mt-1 ${
                isHighRisk ? 'text-[#EF4444]' : 'text-[#98A6B8]'
              }`}
            >
              -{site.cannibalization_units.toLocaleString()} u
            </div>
            <div className="text-[9px] text-[#64748B] font-mono mt-0.5">
              {site.cannibalization_pct}% sales overlap
            </div>
          </div>
        </div>

        {/* Demand Allocation Arithmetic */}
        <div className="p-3 rounded bg-[#151F2D] border border-[#263244]">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#98A6B8] mb-2">
            Demand Allocation Arithmetic
          </div>

          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between items-center text-[#98A6B8]">
              <span className="font-sans">Gross Customer Capture:</span>
              <span className="tabular-nums text-[#E5EAF1]">
                {site.demand_capture.toLocaleString()} u
              </span>
            </div>

            <div className="flex justify-between items-center text-[#EF4444]">
              <span className="font-sans">Less: Own-Store Cannibalization ({site.cannibalization_pct}%):</span>
              <span className="tabular-nums">
                -{site.cannibalization_units.toLocaleString()} u
              </span>
            </div>

            <div className="pt-2 border-t border-[#263244] flex justify-between items-center text-xs font-semibold text-[#22C55E]">
              <span className="font-sans">Net Incremental Demand:</span>
              <span className="tabular-nums">
                +{site.net_incremental_demand.toLocaleString()} u
              </span>
            </div>
          </div>
        </div>

        {/* Explainable AI: Feature Attribution (SHAP Waterfall) */}
        <div className="p-3 rounded bg-[#151F2D] border border-[#263244]">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#98A6B8] mb-2.5">
            Model Explainability (SHAP Attribution)
          </div>

          <SHAPBarChart drivers={site.shap_drivers} />
        </div>

        {/* Executive Verdict Callout */}
        <div className="p-3 rounded bg-[#151F2D] border border-[#263244]">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#98A6B8] mb-1.5">
            Analyst Evaluation Memo
          </div>
          <p className="text-xs text-[#98A6B8] leading-relaxed font-normal">
            {site.verdict}
          </p>
        </div>

        {/* Catchment Characteristics */}
        <div className="p-3 rounded bg-[#151F2D] border border-[#263244] space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#98A6B8] mb-1">
            Catchment Indicators
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded bg-[#111925] border border-[#263244]">
              <div className="text-[9px] font-mono uppercase text-[#64748B]">Residential Pop</div>
              <div className="font-mono font-semibold tabular-nums text-[#E5EAF1] mt-0.5">
                {site.demographics.catchment_population.toLocaleString()}
              </div>
            </div>

            <div className="p-2 rounded bg-[#111925] border border-[#263244]">
              <div className="text-[9px] font-mono uppercase text-[#64748B]">Affluence Index</div>
              <div className="font-mono font-semibold tabular-nums text-[#E5EAF1] mt-0.5">
                {site.demographics.affluence_index} / 10
              </div>
            </div>

            <div className="p-2 rounded bg-[#111925] border border-[#263244]">
              <div className="text-[9px] font-mono uppercase text-[#64748B]">Nearest Competitor</div>
              <div className="font-mono font-semibold tabular-nums text-[#E5EAF1] mt-0.5">
                {site.nearest_competitor_dist_m}m
              </div>
            </div>

            <div className="p-2 rounded bg-[#111925] border border-[#263244]">
              <div className="text-[9px] font-mono uppercase text-[#64748B]">Nearest Own Store</div>
              <div className="font-mono font-semibold tabular-nums text-[#E5EAF1] mt-0.5">
                {site.nearest_own_store_dist_m}m
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

