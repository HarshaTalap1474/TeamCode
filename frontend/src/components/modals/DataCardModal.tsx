'use client';

import React from 'react';
import { X, Database, ShieldCheck, Info, FileCode2, Scale } from 'lucide-react';

interface DataCardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DataCardModal({ isOpen, onClose }: DataCardModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0E1424] border border-slate-800 rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Data Card & Provenance Register</h3>
              <p className="text-xs text-slate-400">Open Data Sources, Methodology, and Stated Assumptions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed">
          {/* Data Sources Table */}
          <div className="space-y-2">
            <span className="font-bold text-slate-100 uppercase tracking-wider text-[11px] block flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Permissive Open Data Inputs</span>
            </span>

            <div className="rounded-lg border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Source</th>
                    <th className="p-2.5">Data Ingested</th>
                    <th className="p-2.5">Licensing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-950/40">
                  <tr>
                    <td className="p-2.5 font-semibold text-slate-200">Overture Maps Places</td>
                    <td className="p-2.5">Competitor POIs, existing brand stores, transit</td>
                    <td className="p-2.5 font-mono text-emerald-400">CDLA-Permissive-2.0</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-slate-200">WorldPop Project</td>
                    <td className="p-2.5">100m residential population & age structures</td>
                    <td className="p-2.5 font-mono text-emerald-400">CC BY 4.0</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-slate-200">OpenStreetMap (OSM)</td>
                    <td className="p-2.5">Road networks, arterial frontage, intersections</td>
                    <td className="p-2.5 font-mono text-emerald-400">ODbL</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Stated Assumptions */}
          <div className="space-y-1.5 p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="font-bold text-slate-100 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-400" />
              <span>Key Analytical Assumptions</span>
            </span>
            <ul className="list-disc pl-4 space-y-1 text-slate-400 text-[11px]">
              <li>
                <strong className="text-slate-300">Huff Gravity Decay:</strong> Consumer willingness to travel decays with distance exponent $\beta = 1.8$ with a 200m minimum threshold.
              </li>
              <li>
                <strong className="text-slate-300">Cannibalization Catchment:</strong> Stores within 800m of an existing branch incur severe sales cannibalization up to 50%.
              </li>
              <li>
                <strong className="text-slate-300">Commercial Rent Proxy:</strong> In absence of private lease data, rent pressure is estimated (1 to 10 scale) using road intersection density and commercial cluster proxies.
              </li>
            </ul>
          </div>

          {/* Limitations */}
          <div className="space-y-1.5 p-3 rounded-lg bg-amber-950/20 border border-amber-800/40 text-amber-300/90 text-[11px]">
            <span className="font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5 text-amber-400">
              <Scale className="w-3.5 h-3.5" />
              <span>Platform Limitations</span>
            </span>
            <p>
              NextWhere produces a <strong>relative decision-support ranking</strong> and viability coverage ratio, not an absolute audited revenue guarantee. Store frontage visibility and municipal legal zoning must be verified on-site by field analysts.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
}
