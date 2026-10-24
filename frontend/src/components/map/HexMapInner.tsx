'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { CandidateSite, POIStore } from '@/lib/types';
import { Layers, Eye, EyeOff } from 'lucide-react';

interface HexMapInnerProps {
  candidates: CandidateSite[];
  pois: POIStore[];
  selectedSite: CandidateSite | null;
  onSelectSite: (site: CandidateSite) => void;
  brand: string;
  city: string;
}

const CITY_COORDINATES: Record<string, [number, number]> = {
  Pune: [18.5204, 73.8567],
  Kolhapur: [16.7050, 74.2433],
  Bangalore: [12.9716, 77.5946],
  Mumbai: [19.0760, 72.8777],
};

// Generate regular hexagon polygon vertices around a center coordinate (approx 450m radius)
function getHexVertices(lat: number, lng: number, radiusKm = 0.55): [number, number][] {
  const vertices: [number, number][] = [];
  const latOffset = radiusKm / 110.574;
  const lngOffset = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));

  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i + Math.PI / 6;
    const vLat = lat + latOffset * Math.sin(angle);
    const vLng = lng + lngOffset * Math.cos(angle);
    vertices.push([vLat, vLng]);
  }
  return vertices;
}

// Modular Basemap Tile Provider Configuration - ready for custom map swapping
export const BASEMAP_CONFIG = {
  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
  options: {
    maxZoom: 18,
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
  },
};

export default function HexMapInner({
  candidates,
  pois,
  selectedSite,
  onSelectSite,
  brand,
  city,
}: HexMapInnerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polygonLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const poiLayerGroupRef = useRef<L.LayerGroup | null>(null);

  const [showHexagons, setShowHexagons] = React.useState(true);
  const [showCompetitors, setShowCompetitors] = React.useState(true);
  const [showOwnStores, setShowOwnStores] = React.useState(true);

  // Initialize Map with 100% Free, Zero-API-Key ESRI Dark Gray Canvas
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialCenter = CITY_COORDINATES[city] || CITY_COORDINATES['Kolhapur'] || [16.7050, 74.2433];

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 13,
      zoomControl: true,
      attributionControl: false,
    });

    // Basemap Layer
    L.tileLayer(BASEMAP_CONFIG.url, BASEMAP_CONFIG.options).addTo(map);

    polygonLayerGroupRef.current = L.layerGroup().addTo(map);
    poiLayerGroupRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    // Force Leaflet to re-measure flex container dimensions
    const resizeTimeout = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      clearTimeout(resizeTimeout);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Smoothly fly to city center when selected city changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const target = CITY_COORDINATES[city] || [18.5204, 73.8567];
    mapInstanceRef.current.flyTo(target, 13, { duration: 1.2 });
  }, [city]);

  // Update Hexagons when candidates or selectedSite changes
  useEffect(() => {
    if (!mapInstanceRef.current || !polygonLayerGroupRef.current) return;

    polygonLayerGroupRef.current.clearLayers();

    if (!showHexagons) return;

    candidates.forEach((site) => {
      const isSelected = selectedSite?.h3_id === site.h3_id;
      const vertices = getHexVertices(site.lat, site.lng);

      // Determine color based on EPS and Cannibalization
      let strokeColor = '#10B981'; // Opportunity Emerald
      let fillColor = '#10B981';
      let fillOpacity = 0.4;

      if (site.cannibalization_pct > 30 || site.risk_level === 'HIGH') {
        strokeColor = '#EF4444'; // Red
        fillColor = '#EF4444';
        fillOpacity = 0.5;
      } else if (site.eps_score < 75 || site.risk_level === 'MEDIUM') {
        strokeColor = '#F59E0B'; // Amber
        fillColor = '#F59E0B';
        fillOpacity = 0.4;
      }

      if (isSelected) {
        strokeColor = '#38BDF8'; // Cyan border for active selection
        fillOpacity = 0.7;
      }

      const polygon = L.polygon(vertices, {
        color: strokeColor,
        weight: isSelected ? 3 : 1.5,
        fillColor: fillColor,
        fillOpacity: fillOpacity,
      });

      // Tooltip on hover
      const tooltipContent = `
        <div style="font-family: inherit; font-size: 12px; line-height: 1.4;">
          <div style="font-weight: 700; color: #F8FAFC;">${site.zone_name}</div>
          <div style="display: flex; gap: 8px; margin-top: 4px;">
            <span style="color: ${strokeColor}; font-weight: 600;">EPS: ${site.eps_score}/100</span>
            <span style="color: #94A3B8;">Rank #${site.rank}</span>
          </div>
          <div style="color: #94A3B8; font-size: 11px; margin-top: 2px;">
            Net Demand: <strong style="color: #F8FAFC;">${site.net_incremental_demand.toLocaleString()} units</strong>
          </div>
          ${
            site.cannibalization_pct > 20
              ? `<div style="color: #EF4444; font-weight: 600; font-size: 10px; margin-top: 3px;">⚠️ ${site.cannibalization_pct}% Cannibalization</div>`
              : ''
          }
        </div>
      `;

      polygon.bindTooltip(tooltipContent, {
        sticky: true,
        direction: 'top',
        className: 'leaflet-custom-tooltip',
      });

      polygon.on('click', () => {
        onSelectSite(site);
        mapInstanceRef.current?.flyTo([site.lat, site.lng], 14, { duration: 0.8 });
      });

      polygonLayerGroupRef.current?.addLayer(polygon);
    });
  }, [candidates, selectedSite, showHexagons, onSelectSite]);

  // Update POI markers (Competitor & Own Brand stores)
  useEffect(() => {
    if (!mapInstanceRef.current || !poiLayerGroupRef.current) return;

    poiLayerGroupRef.current.clearLayers();

    pois.forEach((poi) => {
      const isOwn = poi.type === 'OWN';

      if (isOwn && !showOwnStores) return;
      if (!isOwn && !showCompetitors) return;

      const icon = L.divIcon({
        className: isOwn ? 'marker-own' : 'marker-competitor',
        iconSize: isOwn ? [14, 14] : [12, 12],
        iconAnchor: isOwn ? [7, 7] : [6, 6],
      });

      const marker = L.marker([poi.lat, poi.lng], { icon });

      marker.bindPopup(`
        <div style="font-size: 12px;">
          <strong style="color: ${isOwn ? '#60A5FA' : '#F87171'};">
            ${isOwn ? '🏢 Your Store' : '🎯 Competitor Store'}
          </strong>
          <div style="font-weight: 600; color: #F8FAFC; margin-top: 3px;">${poi.name}</div>
          <div style="color: #94A3B8; font-size: 11px;">Brand: ${poi.brand}</div>
        </div>
      `);

      poiLayerGroupRef.current?.addLayer(marker);
    });
  }, [pois, showOwnStores, showCompetitors]);

  return (
    <div className="relative w-full h-full min-h-[450px] bg-[#080C14]" style={{ height: '100%', minHeight: '100%' }}>
      {/* Map Canvas */}
      <div ref={mapContainerRef} id="map" className="w-full h-full" style={{ height: '100%', minHeight: '100%', width: '100%' }} />

      {/* Layer Controls Floating Widget (Top Left) */}
      <div className="absolute top-4 left-4 z-[400] bg-slate-900/90 backdrop-blur-md border border-slate-800 p-2.5 rounded-lg text-xs shadow-xl flex flex-col gap-2">
        <div className="flex items-center gap-1.5 text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-800 pb-1.5">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span>Spatial Layers</span>
        </div>

        <button
          onClick={() => setShowHexagons(!showHexagons)}
          className={`flex items-center justify-between gap-3 px-2 py-1 rounded transition text-left ${
            showHexagons ? 'bg-slate-800 text-slate-200' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
            <span>H3 Hexagon Zones</span>
          </div>
          {showHexagons ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={() => setShowOwnStores(!showOwnStores)}
          className={`flex items-center justify-between gap-3 px-2 py-1 rounded transition text-left ${
            showOwnStores ? 'bg-slate-800 text-slate-200' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span>{brand} Stores (Own)</span>
          </div>
          {showOwnStores ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={() => setShowCompetitors(!showCompetitors)}
          className={`flex items-center justify-between gap-3 px-2 py-1 rounded transition text-left ${
            showCompetitors ? 'bg-slate-800 text-slate-200' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span>Rival Competitors</span>
          </div>
          {showCompetitors ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Map Legend (Bottom Left with safe margin) */}
      <div className="absolute bottom-4 left-4 z-[400] bg-slate-900/95 backdrop-blur-md border border-slate-800 px-3.5 py-2 rounded-lg text-[11px] shadow-lg flex items-center gap-3.5 text-slate-300 whitespace-nowrap">
        <span className="text-slate-500 font-bold uppercase text-[10px]">EPS Tier:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-emerald-500/60 border border-emerald-400" />
          <span>High Opportunity (&gt;75)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-amber-500/60 border border-amber-400" />
          <span>Moderate (50-75)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-red-500/60 border border-red-400" />
          <span>High Risk / Cannibalization</span>
        </div>
      </div>
    </div>
  );
}
