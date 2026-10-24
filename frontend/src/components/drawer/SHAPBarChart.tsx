'use client';

import React from 'react';
import { SHAPDriver } from '@/lib/types';

interface SHAPBarChartProps {
  drivers: SHAPDriver[];
}

export function SHAPBarChart({ drivers }: SHAPBarChartProps) {
  if (!drivers || drivers.length === 0) {
    return <div className="text-[#64748B] text-xs py-2">No SHAP attribution factors available.</div>;
  }

  const positiveDrivers = drivers.filter((d) => d.type === 'POSITIVE');
  const negativeDrivers = drivers.filter((d) => d.type === 'NEGATIVE');

  return (
    <div className="space-y-3">
      {/* Positive Drivers */}
      {positiveDrivers.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#98A6B8]">
            Positive Attribution (+SHAP)
          </div>
          <div className="space-y-2">
            {positiveDrivers.map((driver, index) => {
              const absVal = Math.min(100, Math.abs(driver.impact) * 2.5);
              return (
                <div key={index} className="text-xs">
                  <div className="flex justify-between text-[#98A6B8] mb-1">
                    <span className="truncate pr-2">{driver.feature}</span>
                    <span className="font-mono text-[#22C55E] font-medium tabular-nums flex-shrink-0">
                      +{Math.abs(driver.impact)}%
                    </span>
                  </div>
                  <div className="w-full h-1 bg-[#1C2A3D] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#22C55E] rounded-full transition-all duration-300"
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
        <div className="space-y-2 pt-2 border-t border-[#1E293B]">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#98A6B8]">
            Negative Attribution (-SHAP)
          </div>
          <div className="space-y-2">
            {negativeDrivers.map((driver, index) => {
              const absVal = Math.min(100, Math.abs(driver.impact) * 2.5);
              return (
                <div key={index} className="text-xs">
                  <div className="flex justify-between text-[#98A6B8] mb-1">
                    <span className="truncate pr-2">{driver.feature}</span>
                    <span className="font-mono text-[#EF4444] font-medium tabular-nums flex-shrink-0">
                      -{Math.abs(driver.impact)}%
                    </span>
                  </div>
                  <div className="w-full h-1 bg-[#1C2A3D] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#EF4444] rounded-full transition-all duration-300"
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

