"use client";

import { useEffect, useRef, useState } from "react";

// Minimal Google Maps typings to avoid any
declare global {
  interface Window {
    google: {
      maps: {
        Map: new (el: HTMLElement, options: { center: { lat: number; lng: number }; zoom: number; mapTypeId: unknown; styles?: unknown }) => unknown;
        Marker: new (options: { position: { lat: number; lng: number }; map: unknown; title?: string }) => { addListener: (event: string, cb: () => void) => void };
        InfoWindow: new (options: { content: string }) => { open: (map: unknown, marker: unknown) => void };
        MapTypeId: { ROADMAP: unknown };
      };
    } | undefined;
  }
}

interface GoogleMapProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  className?: string;
  address?: string;
}

export default function GoogleMap({ 
  latitude, 
  longitude, 
  zoom = 15, 
  className = "h-96 w-full rounded-lg",
  address 
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const initializeMap = () => {
    if (!mapRef.current || !window.google) return;

    try {
      // Initialize the map
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: latitude, lng: longitude },
        zoom: zoom,
        mapTypeId: window.google.maps.MapTypeId.ROADMAP,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      });

      // Add a marker
      const marker = new window.google.maps.Marker({
        position: { lat: latitude, lng: longitude },
        map: map,
        title: address || "Our Office"
      });

      // Add info window
      if (address) {
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div class="p-2">
              <h3 class="font-semibold text-sm">LLC Legal Sandbox Georgia</h3>
              <p class="text-xs text-gray-600">${address}</p>
            </div>
          `
        });

        marker.addListener("click", () => {
          infoWindow.open(map, marker);
        });
      }

      mapInstanceRef.current = map;
    } catch (error) {
      console.error("Error initializing Google Maps:", error);
      setHasError(true);
    }
  };

    // Check if Google Maps is loaded
    if (typeof window !== 'undefined' && window.google && window.google.maps) {
      setIsLoaded(true);
      initializeMap();
    } else {
      // Fallback: show a placeholder with a link to Google Maps
      setHasError(true);
    }
  }, [latitude, longitude, zoom, address]);

  if (hasError || !isLoaded) {
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
            <h3 className="text-sm font-medium">LLC Legal Sandbox Georgia</h3>
            <p className="text-xs text-muted-foreground mb-4">{address}</p>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open in Google Maps
            </a>
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
          href={`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800"
        >
          Get Directions
        </a>
      </div>
    </div>
  );
}
