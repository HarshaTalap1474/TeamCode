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
  (c) => c.category === 'cafe'
);
const initialCalculated = recalculateCandidates(initialCafeCandidates, DEFAULT_WEIGHTS);

export default function DashboardPage() {
  const [city, setCity] = useState('Pune');
  const [category, setCategory] = useState<RetailCategory>('cafe');
  const [brand, setBrand] = useState('Starbucks');

  const [rawCandidates, setRawCandidates] = useState<CandidateSite[]>(initialCafeCandidates);
  const [candidates, setCandidates] = useState<CandidateSite[]>(initialCalculated);
  const [pois, setPois] = useState<POIStore[]>((defaultPOIs as POIStore[]).filter((p) => p.category === 'cafe'));
  const [isLive, setIsLive] = useState(false);

  const [selectedSite, setSelectedSite] = useState<CandidateSite | null>(
    initialCalculated.length > 0 ? initialCalculated[0] : null
  );
  const [comparedSites, setComparedSites] = useState<CandidateSite[]>([]);
  const [weights, setWeights] = useState<SimulationWeights>(DEFAULT_WEIGHTS);

  const [isDataCardOpen, setIsDataCardOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Load data on category or brand change
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      const candidatesResult = await fetchCandidates(category, brand);
      const poiData = await fetchPOIs(category);

      if (!isMounted) return;

      setIsLive(candidatesResult.isLive);
      setRawCandidates(candidatesResult.data);
      setPois(poiData);

      // Apply current simulation weights
      const calculated = recalculateCandidates(candidatesResult.data, weights);
      setCandidates(calculated);

      // Auto-select rank #1 on category change
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
  }, [category, brand]);

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

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#080C14]">
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

      {/* Main Workspace (Map + Leaderboard) */}
      <main className="flex-1 flex relative overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
        {/* Geospatial Interactive Map */}
        <div className="flex-1 h-full relative" style={{ height: '100%', minHeight: '100%' }}>
          <HexMap
            candidates={candidates}
            pois={pois}
            selectedSite={selectedSite}
            onSelectSite={(site) => setSelectedSite(site)}
            brand={brand}
          />

          {/* Floating What-If Sensitivity Simulator Dock */}
          <WhatIfDock
            weights={weights}
            onWeightsChange={handleWeightsChange}
            onReset={handleResetWeights}
          />
        </div>

        {/* Candidate Leaderboard Sidebar */}
        <Leaderboard
          candidates={candidates}
          selectedSite={selectedSite}
          onSelectSite={(site) => setSelectedSite(site)}
          comparedSites={comparedSites}
          onToggleCompare={handleToggleCompare}
          brand={brand}
        />

        {/* Slide-over Explainable AI Site Brief Drawer */}
        {selectedSite && (
          <SiteBriefDrawer
            site={selectedSite}
            onClose={() => setSelectedSite(null)}
            brand={brand}
          />
        )}
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
