'use client';

import React, { useState } from 'react';
import { SimulationWeights } from '@/lib/types';
import { SlidersHorizontal, RotateCcw, ChevronUp, ChevronDown, Activity } from 'lucide-react';

interface WhatIfDockProps {
  weights: SimulationWeights;
  onWeightsChange: (weights: SimulationWeights) => void;
  onReset: () => void;
}

export function WhatIfDock({ weights, onWeightsChange, onReset }: WhatIfDockProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="absolute bottom-5 right-6 z-[1000] w-[460px] max-w-[90vw] bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-xl shadow-[0_10px_35px_rgba(0,0,0,0.8)] transition-all">
      {/* Dock Bar Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Activity className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-slate-100 tracking-tight">
            What-If Sensitivity Simulator
          </span>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
            Live Re-Rank
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onReset}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            title="Reset weights to default baseline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Dock Sliders Body */}
      {isExpanded && (
        <div className="p-3.5 space-y-3 text-xs">
          {/* Demand Pull Weight */}
          <div>
            <div className="flex justify-between text-[11px] mb-1 font-medium">
              <span className="text-slate-300">1. Customer Demand Pull Weight</span>
              <span className="font-mono text-emerald-400 font-bold">{Math.round(weights.demand * 100)}%</span>
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
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* ML Pattern Fit Weight */}
          <div>
            <div className="flex justify-between text-[11px] mb-1 font-medium">
              <span className="text-slate-300">2. ML Pattern Match Weight</span>
              <span className="font-mono text-blue-400 font-bold">{Math.round(weights.pattern * 100)}%</span>
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
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Rent Affordability Weight */}
          <div>
            <div className="flex justify-between text-[11px] mb-1 font-medium">
              <span className="text-slate-300">3. Rent Affordability Sensitivity</span>
              <span className="font-mono text-amber-400 font-bold">{Math.round(weights.rent * 100)}%</span>
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
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800 flex justify-between items-center">
            <span>Dynamic Monte Carlo weight stress test</span>
            <span className="font-mono text-slate-400">Total: {Math.round((weights.demand + weights.pattern + weights.rent) * 100)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
