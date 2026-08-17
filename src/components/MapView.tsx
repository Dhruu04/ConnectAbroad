import React, { useEffect, useRef, useState } from "react";
import type * as LeafletType from "leaflet";

export interface MapMarkerItem {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: "peer" | "event" | "spot" | "cluster";
  category?: string;
  flag?: string;
  avatar?: string;
  subtitle?: string;
  description?: string;
  address?: string;
  googleMapsUrl?: string;
  actionText?: string;
  actionUrl?: string;
}

interface MapViewProps {
  markers: MapMarkerItem[];
  center?: [number, number];
  zoom?: number;
  className?: string;
  onMarkerClick?: (marker: MapMarkerItem) => void;
}

export function MapView({
  markers,
  center = [52.52, 13.405], // Default: Berlin
  zoom = 13,
  className = "h-[450px] w-full rounded-3xl overflow-hidden border border-border shadow-sm relative",
  onMarkerClick,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<LeafletType.Map | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !mapRef.current || typeof window === "undefined") return;

    let isMounted = true;

    async function initMap() {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      if (!isMounted || !mapRef.current) return;

      if (!leafletMapRef.current) {
        // Initialize Leaflet map with free CARTO Voyager tiles
        const map = L.map(mapRef.current, {
          center,
          zoom,
          zoomControl: false,
        });

        L.control.zoom({ position: "bottomright" }).addTo(map);

        L.tileLayer(
          "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
          {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: "abcd",
            maxZoom: 19,
          }
        ).addTo(map);

        leafletMapRef.current = map;
      } else {
        leafletMapRef.current.setView(center, zoom);
      }

      const map = leafletMapRef.current;

      // Clear existing markers
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          map.removeLayer(layer);
        }
      });

      // Custom Clean SVG / Badge Icon Generator for Leaflet (No Emojis)
      markers.forEach((item) => {
        const getMarkerBg = () => {
          if (item.type === "peer") return "bg-accent text-accent-foreground";
          if (item.type === "event") return "bg-emerald-600 text-white";
          if (item.type === "cluster") return "bg-indigo-600 text-white font-black";
          return "bg-amber-600 text-white";
        };

        const getPinText = () => {
          if (item.flag) return item.flag;
          if (item.type === "peer") return "PIN";
          if (item.type === "event") return "EVT";
          if (item.type === "cluster") return "HUB";
          return "MAP";
        };

        const customIcon = L.divIcon({
          className: "custom-leaflet-pin",
          html: `
            <div class="relative flex items-center justify-center min-w-9 h-9 px-2 rounded-full ${getMarkerBg()} shadow-lg border-2 border-white transform transition-transform hover:scale-110 cursor-pointer">
              <span class="text-[10px] font-black tracking-wider uppercase">${getPinText()}</span>
              <div class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-white"></div>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 36],
          popupAnchor: [0, -32],
        });

        const marker = L.marker([item.lat, item.lng], { icon: customIcon }).addTo(map);

        const mapsDirUrl = item.googleMapsUrl || `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(item.address || `${item.lat},${item.lng}`)}`;

        const popupContent = `
          <div class="p-3 max-w-[240px] font-sans">
            <div class="flex items-center gap-2 mb-1.5">
              ${
                item.avatar
                  ? `<img src="${item.avatar}" class="size-8 rounded-full object-cover border border-gray-200" />`
                  : `<div class="size-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-700">${getPinText()}</div>`
              }
              <div>
                <h4 class="font-bold text-xs text-gray-900 leading-tight">${item.name}</h4>
                <p class="text-[10px] text-gray-500 font-medium">${item.subtitle || item.category || ""}</p>
              </div>
            </div>
            ${item.address ? `<p class="text-[10px] font-semibold text-gray-700 mt-1">Address: ${item.address}</p>` : ""}
            ${item.description ? `<p class="text-[11px] text-gray-600 leading-snug my-1 border-t border-gray-100 pt-1">${item.description}</p>` : ""}
            <div class="mt-2.5 flex flex-col gap-1.5">
              <a href="${mapsDirUrl}" target="_blank" rel="noopener noreferrer" class="block w-full text-center py-1.5 px-3 rounded-lg bg-red-600 text-white text-[10px] font-bold tracking-wider uppercase hover:bg-red-700 transition-colors">
                Open in Google Maps
              </a>
              ${
                item.actionUrl
                  ? `<a href="${item.actionUrl}" target="_blank" rel="noopener noreferrer" class="block w-full text-center py-1.5 px-3 rounded-lg bg-gray-900 text-white text-[10px] font-bold tracking-wider uppercase hover:bg-gray-800 transition-colors">${item.actionText || "View Details"}</a>`
                  : ""
              }
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, {
          className: "custom-leaflet-popup",
          closeButton: true,
        });

        if (onMarkerClick) {
          marker.on("click", () => onMarkerClick(item));
        }
      });

      if (markers.length > 0) {
        const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
        }
      } else {
        map.setView(center, zoom);
      }
    }

    initMap();

    return () => {
      isMounted = false;
    };
  }, [isClient, markers, center, zoom, onMarkerClick]);

  return (
    <div className={className}>
      <div ref={mapRef} className="size-full" />
      {!isClient && (
        <div className="absolute inset-0 bg-surface/80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground animate-pulse">
            <span>Loading Interactive Map...</span>
          </div>
        </div>
      )}
    </div>
  );
}
