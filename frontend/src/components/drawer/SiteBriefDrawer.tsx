'use client';

import React from 'react';
import { CandidateSite } from '@/lib/types';
import { SHAPBarChart } from './SHAPBarChart';
import {
  X,
  TrendingUp,
  AlertTriangle,
  Building2,
  Users,
  Compass,
  FileText,
  DollarSign,
  MapPin,
  CheckCircle,
} from 'lucide-react';

interface SiteBriefDrawerProps {
  site: CandidateSite | null;
  onClose: () => void;
  brand: string;
}

export function SiteBriefDrawer({ site, onClose, brand }: SiteBriefDrawerProps) {
  if (!site) return null;

  const isHighRisk = site.cannibalization_pct > 30 || site.risk_level === 'HIGH';

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] max-w-full bg-[#0E1424] border-l border-slate-800 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-800 flex items-start justify-between bg-slate-900/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">
              Site Brief #{site.rank}
            </span>
            <span className="text-xs font-mono text-slate-400">
              {site.h3_id.slice(0, 12)}
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-100">{site.zone_name}</h2>
          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-slate-500" />
            <span>Targeting {brand} Chain Expansion</span>
          </p>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Drawer Body Scroll */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Master Score Banner */}
        <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Expansion Priority Score (EPS)
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-mono font-black text-slate-100">{site.eps_score}</span>
              <span className="text-xs text-slate-500 font-mono">/ 100</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Percentile ranking across all city zones
            </span>
          </div>

          <div className="text-right">
            <span
              className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold font-mono border ${
                isHighRisk
                  ? 'bg-red-500/15 text-red-400 border-red-500/30'
                  : site.eps_score > 75
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
              }`}
            >
              {site.risk_level} RISK
            </span>
            <span className="text-[11px] text-slate-500 block mt-1">Coverage: {site.coverage_ratio}x</span>
          </div>
        </div>

        {/* Demand & Cannibalization Arithmetic */}
        <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 uppercase tracking-wider mb-2.5">
            <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
            <span>Demand Allocation Arithmetic</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-300">
              <span>Gross Customer Capture (Huff Model):</span>
              <span className="font-mono font-semibold text-slate-100">
                {site.demand_capture.toLocaleString()} units
              </span>
            </div>

            <div className="flex justify-between items-center text-red-400">
              <span className="flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Own-Store Cannibalization ({site.cannibalization_pct}%):</span>
              </span>
              <span className="font-mono font-semibold">
                -{site.cannibalization_units.toLocaleString()} units
              </span>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-bold">
              <span className="text-emerald-400">Net Incremental Demand (NID):</span>
              <span className="font-mono text-emerald-400">
                +{site.net_incremental_demand.toLocaleString()} units
              </span>
            </div>
          </div>
        </div>

        {/* Explainable AI (SHAP Driver Chart) */}
        <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
            <Compass className="w-3.5 h-3.5 text-blue-400" />
            <span>Explainable AI: Feature Attribution (SHAP)</span>
          </div>

          <SHAPBarChart drivers={site.shap_drivers} />
        </div>

        {/* Executive AI Verdict */}
        <div className="p-3.5 rounded-lg bg-blue-950/20 border border-blue-800/40 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-blue-300 uppercase tracking-wider mb-1.5">
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>Executive Site Verdict</span>
          </div>
          <p className="text-slate-300 leading-relaxed font-normal">{site.verdict}</p>
        </div>

        {/* Demographics & Spatial Context */}
        <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-200 uppercase tracking-wider mb-2">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span>Catchment Characteristics</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-slate-300">
            <div className="p-2 rounded bg-slate-800/60 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Residential Population</span>
              <span className="font-mono font-semibold text-slate-100">
                {site.demographics.catchment_population.toLocaleString()}
              </span>
            </div>

            <div className="p-2 rounded bg-slate-800/60 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Affluence Index</span>
              <span className="font-mono font-semibold text-slate-100">
                {site.demographics.affluence_index} / 10
              </span>
            </div>

            <div className="p-2 rounded bg-slate-800/60 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Nearest Competitor</span>
              <span className="font-mono font-semibold text-slate-100">
                {site.nearest_competitor_dist_m}m
              </span>
            </div>

            <div className="p-2 rounded bg-slate-800/60 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Nearest Own Store</span>
              <span className="font-mono font-semibold text-slate-100">
                {site.nearest_own_store_dist_m}m
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
