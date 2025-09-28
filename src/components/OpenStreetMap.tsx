"use client";

import { useEffect, useRef, useState } from "react";

interface OpenStreetMapProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  className?: string;
  address?: string;
  companyName?: string;
  getDirectionsText?: string;
  viewOnOsmText?: string;
}

export default function OpenStreetMap({ 
  latitude, 
  longitude, 
  zoom = 15, 
  className = "h-96 w-full rounded-lg",
  address,
  companyName = "LLC Legal Sandbox Georgia",
  getDirectionsText = "Get Directions",
  viewOnOsmText = "View on OSM"
}: OpenStreetMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!mapRef.current) return;

    // Prevent multiple initializations
    if (mapInstanceRef.current) return;

    // Load Leaflet CSS and JS dynamically
    const loadLeaflet = async () => {
      // Load CSS
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        link.crossOrigin = '';
        document.head.appendChild(link);
      }

      // Load JS
      if (!window.L) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
        script.crossOrigin = '';
        script.async = true;
        
        return new Promise<void>((resolve, reject) => {
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Leaflet'));
          document.head.appendChild(script);
        });
      }
    };

    const initializeMap = () => {
      if (!mapRef.current || !window.L) return;

      try {
        // Check if map is already initialized and clean it up
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        // Initialize the map
        const map = window.L.map(mapRef.current).setView([latitude, longitude], zoom);

        // Add OpenStreetMap tiles
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19
        }).addTo(map);

        // Add a marker
        const marker = window.L.marker([latitude, longitude]).addTo(map);

        // Add popup with company information
        if (address) {
          marker.bindPopup(`
            <div style="padding: 8px; min-width: 200px;">
              <h3 style="margin: 0 0 8px 0; font-weight: 600; font-size: 14px;">${companyName}</h3>
              <p style="margin: 0; font-size: 12px; color: #666;">${address}</p>
            </div>
          `);
        }

        mapInstanceRef.current = map;
      } catch (error) {
        console.error("Error initializing OpenStreetMap:", error);
        setHasError(true);
      }
    };

    // Load Leaflet and initialize map
    loadLeaflet()
      .then(() => {
        // Wait a bit for Leaflet to be fully loaded
        setTimeout(initializeMap, 100);
      })
      .catch((error) => {
        console.error("Failed to load Leaflet:", error);
        setHasError(true);
      });

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (error) {
          console.warn("Error removing map instance:", error);
        }
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude, zoom, address, companyName]);

  if (hasError) {
    return (
      <div className={`relative ${className}`}>
        <div className="flex h-full items-center justify-center rounded-lg border bg-muted">
          <div className="text-center">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium">{companyName}</h3>
            <p className="text-xs text-muted-foreground mb-4">{address}</p>
            <div className="space-x-2">
              <a
                href={`https://www.openstreetmap.org/directions?engine=osrm_car&route=${latitude},${longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                {getDirectionsText}
              </a>
              <a
                href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=${zoom}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-xs font-medium hover:bg-accent hover:text-accent-foreground"
              >
                {viewOnOsmText}
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={mapRef} className={className} />
      <div className="absolute bottom-2 right-2 rounded bg-white px-2 py-1 text-xs shadow-md">
        <a
          href={`https://www.openstreetmap.org/directions?engine=osrm_car&route=${latitude},${longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800"
        >
          {getDirectionsText}
        </a>
      </div>
      <div className="absolute bottom-2 left-2 rounded bg-white px-2 py-1 text-xs shadow-md">
        <a
          href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=${zoom}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800"
        >
          {viewOnOsmText}
        </a>
      </div>
    </div>
  );
}

// Extend Window interface to include Leaflet
declare global {
  interface Window {
    L: typeof import('leaflet');
  }
}
