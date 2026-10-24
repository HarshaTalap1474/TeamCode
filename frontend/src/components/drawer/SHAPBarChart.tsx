'use client';

import React from 'react';
import { SHAPDriver } from '@/lib/types';
import { ShieldCheck, AlertCircle } from 'lucide-react';

interface SHAPBarChartProps {
  drivers: SHAPDriver[];
}

export function SHAPBarChart({ drivers }: SHAPBarChartProps) {
  if (!drivers || drivers.length === 0) {
    return <div className="text-slate-500 text-xs py-2">No SHAP attribution factors available.</div>;
  }

  const positiveDrivers = drivers.filter((d) => d.type === 'POSITIVE');
  const negativeDrivers = drivers.filter((d) => d.type === 'NEGATIVE');

  return (
    <div className="space-y-4">
      {/* Positive Drivers */}
      {positiveDrivers.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Key Competitive Advantages (+SHAP)</span>
          </div>
          <div className="space-y-2">
            {positiveDrivers.map((driver, index) => {
              const absVal = Math.min(100, Math.abs(driver.impact) * 2.5); // scale for visual bar
              return (
                <div key={index} className="text-xs">
                  <div className="flex justify-between text-slate-300 font-medium mb-1">
                    <span>{driver.feature}</span>
                    <span className="font-mono text-emerald-400 font-semibold">
                      +{Math.abs(driver.impact)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${absVal}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Negative / Risk Drivers */}
      {negativeDrivers.length > 0 && (
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-red-400 uppercase tracking-wider mb-2">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Risk Penalties & Deterrents (-SHAP)</span>
          </div>
          <div className="space-y-2">
            {negativeDrivers.map((driver, index) => {
              const absVal = Math.min(100, Math.abs(driver.impact) * 2.5);
              return (
                <div key={index} className="text-xs">
                  <div className="flex justify-between text-slate-300 font-medium mb-1">
                    <span>{driver.feature}</span>
                    <span className="font-mono text-red-400 font-semibold">
                      -{Math.abs(driver.impact)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 rounded-full transition-all duration-500"
                      style={{ width: `${absVal}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
