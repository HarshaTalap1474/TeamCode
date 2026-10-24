'use client';

import React, { useState } from 'react';
import { SimulationWeights } from '@/lib/types';
import { RotateCcw, ChevronUp, ChevronDown, SlidersHorizontal } from 'lucide-react';

interface WhatIfDockProps {
  weights: SimulationWeights;
  onWeightsChange: (weights: SimulationWeights) => void;
  onReset: () => void;
}

export function WhatIfDock({ weights, onWeightsChange, onReset }: WhatIfDockProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[400] w-[460px] max-w-[calc(100%-2rem)] bg-[#111925]/95 backdrop-blur-md border border-[#263244] rounded-lg shadow-2xl transition-all">
      {/* Header */}
      <div className="p-2.5 px-3 border-b border-[#263244] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#4C8DFF]" />
          <span className="text-xs font-semibold text-[#E5EAF1]">
            Sensitivity Simulator
          </span>
          <span className="text-[9px] font-mono text-[#98A6B8] bg-[#151F2D] px-1.5 py-0.2 rounded border border-[#263244]">
            Dynamic Re-Rank
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onReset}
            className="p-1 rounded text-[#98A6B8] hover:text-[#E5EAF1] hover:bg-[#151F2D] transition"
            title="Reset to Baseline (40% / 30% / 30%)"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded text-[#98A6B8] hover:text-[#E5EAF1] hover:bg-[#151F2D] transition"
          >
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Sliders */}
      {isExpanded && (
        <div className="p-3 space-y-2.5 text-xs">
          {/* Demand Pull Weight */}
          <div>
            <div className="flex justify-between text-[11px] mb-1 font-medium">
              <span className="text-[#98A6B8]">1. Demand Pull (Huff Gravitation)</span>
              <span className="font-mono text-[#22C55E] font-semibold tabular-nums">
                {Math.round(weights.demand * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.8"
              step="0.05"
              value={weights.demand}
              onChange={(e) =>
                onWeightsChange({ ...weights, demand: parseFloat(e.target.value) })
              }
              className="w-full h-1 bg-[#1C2A3D] rounded appearance-none cursor-pointer accent-[#22C55E]"
            />
          </div>

          {/* ML Pattern Match */}
          <div>
            <div className="flex justify-between text-[11px] mb-1 font-medium">
              <span className="text-[#98A6B8]">2. Spatial Pattern Match (XGBoost)</span>
              <span className="font-mono text-[#4C8DFF] font-semibold tabular-nums">
                {Math.round(weights.pattern * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.8"
              step="0.05"
              value={weights.pattern}
              onChange={(e) =>
                onWeightsChange({ ...weights, pattern: parseFloat(e.target.value) })
              }
              className="w-full h-1 bg-[#1C2A3D] rounded appearance-none cursor-pointer accent-[#4C8DFF]"
            />
          </div>

          {/* Rent Affordability */}
          <div>
            <div className="flex justify-between text-[11px] mb-1 font-medium">
              <span className="text-[#98A6B8]">3. Commercial Rent Affordability</span>
              <span className="font-mono text-[#F59E0B] font-semibold tabular-nums">
                {Math.round(weights.rent * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.8"
              step="0.05"
              value={weights.rent}
              onChange={(e) =>
                onWeightsChange({ ...weights, rent: parseFloat(e.target.value) })
              }
              className="w-full h-1 bg-[#1C2A3D] rounded appearance-none cursor-pointer accent-[#F59E0B]"
            />
          </div>

          <div className="text-[10px] text-[#64748B] pt-1.5 border-t border-[#263244] flex justify-between items-center font-mono">
            <span>Deterministic mathematical re-ranking</span>
            <span className="tabular-nums">Sum: {Math.round((weights.demand + weights.pattern + weights.rent) * 100)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}

