'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { HexMap } from '@/components/map/HexMap';
import { Leaderboard } from '@/components/leaderboard/Leaderboard';
import { SiteBriefDrawer } from '@/components/drawer/SiteBriefDrawer';
import { WhatIfDock } from '@/components/simulator/WhatIfDock';
import { CompareModal } from '@/components/compare/CompareModal';
import { DataCardModal } from '@/components/modals/DataCardModal';
import { fetchCandidates, fetchPOIs } from '@/lib/api';
import { recalculateCandidates } from '@/lib/simulation';
import { CandidateSite, POIStore, RetailCategory, SimulationWeights } from '@/lib/types';
import defaultCandidates from '@/mock/candidates.json';
import defaultPOIs from '@/mock/pois.json';

const DEFAULT_WEIGHTS: SimulationWeights = {
  demand: 0.4,
  pattern: 0.3,
  rent: 0.3,
};

// Initial state loaded synchronously from mock data so frame 1 has full content
const initialCafeCandidates = (defaultCandidates as CandidateSite[]).filter(
  (c) => c.category === 'cafe' && (!c.city || c.city === 'Kolhapur')
);
const initialCalculated = recalculateCandidates(initialCafeCandidates, DEFAULT_WEIGHTS);

export default function DashboardPage() {
  const [city, setCity] = useState('Kolhapur');
  const [category, setCategory] = useState<RetailCategory>('cafe');
  const [brand, setBrand] = useState('Starbucks');

  const [rawCandidates, setRawCandidates] = useState<CandidateSite[]>(initialCafeCandidates);
  const [candidates, setCandidates] = useState<CandidateSite[]>(initialCalculated);
  const [pois, setPois] = useState<POIStore[]>(
    (defaultPOIs as POIStore[]).filter((p) => p.category === 'cafe' && (!p.city || p.city === 'Kolhapur'))
  );
  const [isLive, setIsLive] = useState(false);

  const [selectedSite, setSelectedSite] = useState<CandidateSite | null>(
    initialCalculated.length > 0 ? initialCalculated[0] : null
  );
  const [rightPanelMode, setRightPanelMode] = useState<'leaderboard' | 'brief'>('leaderboard');
  const [comparedSites, setComparedSites] = useState<CandidateSite[]>([]);
  const [weights, setWeights] = useState<SimulationWeights>(DEFAULT_WEIGHTS);

  const [isDataCardOpen, setIsDataCardOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Load data on category, brand, or city change
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      const candidatesResult = await fetchCandidates(category, brand, city);
      const poiData = await fetchPOIs(category, city);

      if (!isMounted) return;

      setIsLive(candidatesResult.isLive);
      setRawCandidates(candidatesResult.data);
      setPois(poiData);

      // Apply current simulation weights
      const calculated = recalculateCandidates(candidatesResult.data, weights);
      setCandidates(calculated);

      // Select rank #1 on filter or city change
      if (calculated.length > 0) {
        setSelectedSite(calculated[0]);
      } else {
        setSelectedSite(null);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [category, brand, city]);

  // Handle simulation weight updates
  const handleWeightsChange = useCallback(
    (newWeights: SimulationWeights) => {
      setWeights(newWeights);
      if (rawCandidates.length > 0) {
        const updated = recalculateCandidates(rawCandidates, newWeights);
        setCandidates(updated);

        // Keep selected site updated with newly calculated score
        if (selectedSite) {
          const matching = updated.find((s) => s.h3_id === selectedSite.h3_id);
          if (matching) setSelectedSite(matching);
        }
      }
    },
    [rawCandidates, selectedSite]
  );

  const handleResetWeights = () => {
    handleWeightsChange(DEFAULT_WEIGHTS);
  };

  // Toggle comparison selection (max 2)
  const handleToggleCompare = (site: CandidateSite) => {
    setComparedSites((prev) => {
      const exists = prev.some((s) => s.h3_id === site.h3_id);
      if (exists) {
        return prev.filter((s) => s.h3_id !== site.h3_id);
      }
      if (prev.length >= 2) {
        return [prev[1], site]; // replace oldest
      }
      return [...prev, site];
    });
  };

  const handleSelectSite = (site: CandidateSite) => {
    setSelectedSite(site);
    setRightPanelMode('brief');
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0B1018]">
      {/* Platform Navigation Header */}
      <Header
        category={category}
        setCategory={setCategory}
        brand={brand}
        setBrand={setBrand}
        city={city}
        setCity={setCity}
        isLive={isLive}
        onOpenDataCard={() => setIsDataCardOpen(true)}
        onOpenCompare={() => setIsCompareModalOpen(true)}
        compareCount={comparedSites.length}
      />

      {/* Main Workspace (Map + Sidebar) */}
      <main className="flex-1 flex relative overflow-hidden h-[calc(100vh-48px)]">
        {/* Geospatial Interactive Map */}
        <div className="flex-1 h-full relative" style={{ height: '100%', minHeight: '100%' }}>
          <HexMap
            candidates={candidates}
            pois={pois}
            selectedSite={selectedSite}
            onSelectSite={handleSelectSite}
            brand={brand}
            city={city}
          />

          {/* Floating What-If Sensitivity Simulator Dock */}
          <WhatIfDock
            weights={weights}
            onWeightsChange={handleWeightsChange}
            onReset={handleResetWeights}
          />
        </div>

        {/* Unified Right Intelligence Sidebar */}
        <aside className="w-[420px] flex-shrink-0 h-full flex flex-col bg-[#111925] border-l border-[#263244] z-10 overflow-hidden">
          {/* Top Mode Navigation Tabs */}
          <div className="h-10 border-b border-[#263244] bg-[#0E1520] px-3 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setRightPanelMode('leaderboard')}
                className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition ${
                  rightPanelMode === 'leaderboard'
                    ? 'bg-[#151F2D] text-[#E5EAF1] border border-[#263244]'
                    : 'text-[#98A6B8] hover:text-[#E5EAF1]'
                }`}
              >
                <span>Rankings</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#1C2A3D] text-[#98A6B8]">
                  {candidates.length}
                </span>
              </button>

              <button
                onClick={() => selectedSite && setRightPanelMode('brief')}
                disabled={!selectedSite}
                className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition ${
                  rightPanelMode === 'brief'
                    ? 'bg-[#151F2D] text-[#E5EAF1] border border-[#263244]'
                    : selectedSite
                    ? 'text-[#98A6B8] hover:text-[#E5EAF1]'
                    : 'text-[#64748B] cursor-not-allowed opacity-50'
                }`}
              >
                <span>Site Intelligence</span>
                {selectedSite && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#4C8DFF]/15 text-[#4C8DFF] border border-[#4C8DFF]/30">
                    #{selectedSite.rank}
                  </span>
                )}
              </button>
            </div>

            {rightPanelMode === 'brief' && (
              <button
                onClick={() => setRightPanelMode('leaderboard')}
                className="text-xs text-[#98A6B8] hover:text-[#E5EAF1] transition flex items-center gap-1"
              >
                ← List
              </button>
            )}
          </div>

          {/* Sidebar Body */}
          <div className="flex-1 overflow-hidden">
            {rightPanelMode === 'leaderboard' ? (
              <Leaderboard
                candidates={candidates}
                selectedSite={selectedSite}
                onSelectSite={handleSelectSite}
                comparedSites={comparedSites}
                onToggleCompare={handleToggleCompare}
                brand={brand}
                city={city}
              />
            ) : (
              selectedSite && (
                <SiteBriefDrawer
                  site={selectedSite}
                  onClose={() => setRightPanelMode('leaderboard')}
                  brand={brand}
                />
              )
            )}
          </div>
        </aside>
      </main>

      {/* Side-by-Side Site Comparison Modal */}
      <CompareModal
        sites={comparedSites}
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        brand={brand}
      />

      {/* Data Governance & Provenance Modal */}
      <DataCardModal
        isOpen={isDataCardOpen}
        onClose={() => setIsDataCardOpen(false)}
      />
    </div>
  );
}
