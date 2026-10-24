'use client';

import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { CandidateSite, POIStore } from '@/lib/types';
import { Layers, Eye, EyeOff, Compass } from 'lucide-react';

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

// Modular Basemap Tile Provider Configurations - Free & Zero API Key
export type BasemapKey = 'googleHybrid' | 'googleRoadmap' | 'darkCanvas';

export const BASEMAP_PROVIDERS: Record<
  BasemapKey,
  {
    name: string;
    label: string;
    icon: string;
    url: string;
    options: L.TileLayerOptions;
  }
> = {
  googleHybrid: {
    name: 'Google Satellite Hybrid',
    label: 'Satellite',
    icon: '🛰️',
    url: 'https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    options: {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '&copy; Google Maps',
    },
  },
  googleRoadmap: {
    name: 'Google Streets',
    label: 'Streets',
    icon: '🗺️',
    url: 'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    options: {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '&copy; Google Maps',
    },
  },
  darkCanvas: {
    name: 'Dark Gray Canvas',
    label: 'Dark',
    icon: '🌑',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    options: {
      maxZoom: 18,
      attribution: '&copy; Esri',
    },
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
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const polygonLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const poiLayerGroupRef = useRef<L.LayerGroup | null>(null);

  const [currentBasemap, setCurrentBasemap] = React.useState<BasemapKey>('googleHybrid');
  const [showHexagons, setShowHexagons] = React.useState(true);
  const [showCompetitors, setShowCompetitors] = React.useState(true);
  const [showOwnStores, setShowOwnStores] = React.useState(true);

  // Initialize Map with Google Satellite Hybrid & Bottom-Right Controls
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialCenter = CITY_COORDINATES[city] || CITY_COORDINATES['Kolhapur'] || [16.7050, 74.2433];

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 13,
      zoomControl: false, // Positioned at bottomright below
      attributionControl: true, // Displays 'Leaflet | © Google Maps' as in reference
    });

    // Custom positioned Zoom Control (bottom-right matching screenshot)
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Initial Base Tile Layer
    const provider = BASEMAP_PROVIDERS[currentBasemap];
    const initialTiles = L.tileLayer(provider.url, provider.options).addTo(map);
    tileLayerRef.current = initialTiles;

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

  // Update Tile Layer dynamically when user switches basemap
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    const provider = BASEMAP_PROVIDERS[currentBasemap];
    const newTiles = L.tileLayer(provider.url, provider.options).addTo(mapInstanceRef.current);
    newTiles.bringToBack();
    tileLayerRef.current = newTiles;
  }, [currentBasemap]);

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
      let strokeColor = '#22C55E'; // Opportunity Green
      let fillColor = '#22C55E';
      let fillOpacity = 0.30;

      if (site.cannibalization_pct > 25 || site.risk_level === 'HIGH') {
        strokeColor = '#EF4444'; // Red
        fillColor = '#EF4444';
        fillOpacity = 0.35;
      } else if (site.eps_score < 75 || site.risk_level === 'MEDIUM') {
        strokeColor = '#F59E0B'; // Amber
        fillColor = '#F59E0B';
        fillOpacity = 0.30;
      }

      if (isSelected) {
        strokeColor = '#4C8DFF'; // Enterprise Action Blue
        fillOpacity = 0.45;
      }

      const polygon = L.polygon(vertices, {
        color: strokeColor,
        weight: isSelected ? 3 : 1.5,
        fillColor: fillColor,
        fillOpacity: fillOpacity,
      });

      // Tooltip on hover
      const tooltipContent = `
        <div style="font-family: inherit; font-size: 11px; line-height: 1.4; color: #E5EAF1;">
          <div style="font-weight: 600; color: #E5EAF1;">${site.zone_name}</div>
          <div style="display: flex; gap: 8px; margin-top: 3px; font-family: monospace;">
            <span style="color: ${strokeColor}; font-weight: 700;">EPS: ${site.eps_score}/100</span>
            <span style="color: #98A6B8;">Rank #${site.rank}</span>
          </div>
          <div style="color: #98A6B8; font-size: 10px; margin-top: 2px;">
            Net Demand: <strong style="color: #22C55E; font-family: monospace;">+${site.net_incremental_demand.toLocaleString()} u</strong>
          </div>
          ${
            site.cannibalization_pct > 20
              ? `<div style="color: #EF4444; font-weight: 600; font-size: 10px; margin-top: 2px; font-family: monospace;">${site.cannibalization_pct}% Cannibalization</div>`
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
    <div className="relative w-full h-full min-h-[450px] bg-[#0B1018]" style={{ height: '100%', minHeight: '100%' }}>
      {/* Map Canvas */}
      <div ref={mapContainerRef} id="map" className="w-full h-full" style={{ height: '100%', minHeight: '100%', width: '100%' }} />

      {/* Layer Controls Floating Widget (Top Left) */}
      <div className="absolute top-3 left-3 z-[400] bg-[#111925]/95 backdrop-blur-md border border-[#263244] p-2.5 rounded text-xs shadow-xl flex flex-col gap-2 w-52">
        {/* Basemap Selection */}
        <div>
          <div className="flex items-center gap-1.5 text-[#98A6B8] font-mono uppercase text-[10px] tracking-wider mb-1">
            <Compass className="w-3 h-3 text-[#4C8DFF]" />
            <span>Map Style</span>
          </div>
          <div className="grid grid-cols-3 gap-1 bg-[#151F2D] p-1 rounded border border-[#263244]">
            {(Object.keys(BASEMAP_PROVIDERS) as BasemapKey[]).map((key) => {
              const b = BASEMAP_PROVIDERS[key];
              const isActive = currentBasemap === key;
              return (
                <button
                  key={key}
                  onClick={() => setCurrentBasemap(key)}
                  className={`px-1 py-1 rounded text-[10px] font-medium transition text-center flex flex-col items-center gap-0.5 ${
                    isActive
                      ? 'bg-[#1C2A3D] text-[#E5EAF1] border border-[#4C8DFF]/40'
                      : 'text-[#98A6B8] hover:text-[#E5EAF1] hover:bg-[#1C2A3D]/50 border border-transparent'
                  }`}
                  title={b.name}
                >
                  <span className="text-[11px]">{b.icon}</span>
                  <span className="truncate">{b.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Feature Overlays */}
        <div className="border-t border-[#263244] pt-2 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-[#98A6B8] font-mono uppercase text-[10px] tracking-wider mb-0.5">
            <Layers className="w-3 h-3 text-[#22C55E]" />
            <span>Overlays</span>
          </div>

          <button
            onClick={() => setShowHexagons(!showHexagons)}
            className={`flex items-center justify-between gap-2 px-1.5 py-1 rounded transition text-left text-[11px] ${
              showHexagons ? 'bg-[#151F2D] text-[#E5EAF1]' : 'text-[#64748B] hover:text-[#98A6B8]'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm bg-[#22C55E]" />
              <span>H3 Hexagon Grid</span>
            </div>
            {showHexagons ? <Eye className="w-3 h-3 text-[#22C55E]" /> : <EyeOff className="w-3 h-3 text-[#64748B]" />}
          </button>

          <button
            onClick={() => setShowOwnStores(!showOwnStores)}
            className={`flex items-center justify-between gap-2 px-1.5 py-1 rounded transition text-left text-[11px] ${
              showOwnStores ? 'bg-[#151F2D] text-[#E5EAF1]' : 'text-[#64748B] hover:text-[#98A6B8]'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
              <span>{brand} Stores (Own)</span>
            </div>
            {showOwnStores ? <Eye className="w-3 h-3 text-[#4C8DFF]" /> : <EyeOff className="w-3 h-3 text-[#64748B]" />}
          </button>

          <button
            onClick={() => setShowCompetitors(!showCompetitors)}
            className={`flex items-center justify-between gap-2 px-1.5 py-1 rounded transition text-left text-[11px] ${
              showCompetitors ? 'bg-[#151F2D] text-[#E5EAF1]' : 'text-[#64748B] hover:text-[#98A6B8]'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
              <span>Rival Competitors</span>
            </div>
            {showCompetitors ? <Eye className="w-3 h-3 text-[#EF4444]" /> : <EyeOff className="w-3 h-3 text-[#64748B]" />}
          </button>
        </div>

        {/* EPS Tier Legend */}
        <div className="border-t border-[#263244] pt-2 flex flex-col gap-1 font-mono text-[10px]">
          <span className="text-[#98A6B8] uppercase tracking-wider text-[9px]">EPS Opportunity Tier</span>
          <div className="flex items-center justify-between text-[#98A6B8] pt-0.5">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-[#22C55E]/40 border border-[#22C55E]" />
              <span>&gt;75</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-[#F59E0B]/40 border border-[#F59E0B]" />
              <span>50-75</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-[#EF4444]/40 border border-[#EF4444]" />
              <span>Risk</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
