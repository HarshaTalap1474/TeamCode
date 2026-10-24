'use client';

import React from 'react';
import { X, Database, ShieldCheck, Info, Scale } from 'lucide-react';

interface DataCardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DataCardModal({ isOpen, onClose }: DataCardModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111925] border border-[#263244] rounded-lg max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-3.5 border-b border-[#263244] flex items-center justify-between bg-[#0E1520]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-[#151F2D] border border-[#263244] flex items-center justify-center text-[#4C8DFF]">
              <Database className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#E5EAF1]">Data Card & Model Provenance</h3>
              <p className="text-[11px] text-[#98A6B8]">Open Data Inputs, Methodology, and Analytical Parameters</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded bg-[#151F2D] text-[#98A6B8] hover:text-[#E5EAF1] border border-[#263244] transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-3.5 text-xs text-[#98A6B8] leading-relaxed">
          {/* Data Sources Table */}
          <div className="space-y-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#98A6B8] block flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#22C55E]" />
              <span>Ingested Data Sources</span>
            </span>

            <div className="rounded border border-[#263244] overflow-hidden">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-[#0E1520] text-[#98A6B8] font-medium border-b border-[#263244]">
                  <tr>
                    <th className="p-2">Source</th>
                    <th className="p-2">Data Ingested</th>
                    <th className="p-2">Licensing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B] bg-[#151F2D]">
                  <tr>
                    <td className="p-2 font-medium text-[#E5EAF1]">Overture Maps Places</td>
                    <td className="p-2">Competitor POIs, existing brand stores, transit</td>
                    <td className="p-2 font-mono text-[#22C55E]">CDLA-Permissive-2.0</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-medium text-[#E5EAF1]">WorldPop Project</td>
                    <td className="p-2">100m residential population & age structures</td>
                    <td className="p-2 font-mono text-[#22C55E]">CC BY 4.0</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-medium text-[#E5EAF1]">OpenStreetMap (OSM)</td>
                    <td className="p-2">Road networks, arterial frontage, intersections</td>
                    <td className="p-2 font-mono text-[#22C55E]">ODbL</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Stated Assumptions */}
          <div className="space-y-1.5 p-3 rounded bg-[#151F2D] border border-[#263244]">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#98A6B8] flex items-center gap-1.5">
              <Info className="w-3 h-3 text-[#4C8DFF]" />
              <span>Analytical Assumptions & Constants</span>
            </span>
            <ul className="list-disc pl-4 space-y-1 text-[#98A6B8] text-[11px]">
              <li>
                <strong className="text-[#E5EAF1]">Huff Gravity Decay:</strong> Consumer willingness to travel decays with distance exponent $\beta = 1.8$ with a 200m minimum threshold.
              </li>
              <li>
                <strong className="text-[#E5EAF1]">Cannibalization Catchment:</strong> Stores within 800m of an existing branch incur severe sales cannibalization up to 50%.
              </li>
              <li>
                <strong className="text-[#E5EAF1]">Commercial Rent Proxy:</strong> In absence of private lease data, rent pressure is estimated (1 to 10 scale) using road intersection density and commercial cluster proxies.
              </li>
            </ul>
          </div>

          {/* Limitations */}
          <div className="space-y-1.5 p-3 rounded bg-[#151F2D] border border-[#263244] text-[11px]">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#98A6B8] flex items-center gap-1.5">
              <Scale className="w-3 h-3 text-[#F59E0B]" />
              <span>Platform Limitations</span>
            </span>
            <p>
              NextWhere produces a <strong>relative decision-support ranking</strong> and viability coverage ratio, not an absolute audited revenue guarantee. Store frontage visibility and municipal legal zoning must be verified on-site by field analysts.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#263244] bg-[#0E1520] flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-[#151F2D] hover:bg-[#1C2A3D] text-[#E5EAF1] text-xs font-medium border border-[#263244] transition"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
}

