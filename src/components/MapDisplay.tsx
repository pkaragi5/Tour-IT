import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Navigation, ExternalLink, LocateFixed } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { Activity } from '@/src/types';

// Custom premium marker icon
const createMarkerIcon = (isSelected: boolean) => L.divIcon({
  html: `<div class="relative flex items-center justify-center transition-transform duration-500 ease-out ${isSelected ? 'scale-125 z-[1000]' : 'scale-100'}">
          <!-- Animated pulse for selected state -->
          <div class="absolute w-10 h-10 ${isSelected ? 'bg-brand-accent/30 animate-pulse' : 'bg-transparent'} rounded-full"></div>
          <div class="absolute w-14 h-14 ${isSelected ? 'bg-brand-accent/10 animate-ping' : 'bg-transparent'} rounded-full"></div>
          
          <!-- Marker Body -->
          <div class="relative w-6 h-6 bg-white border-2 ${isSelected ? 'border-brand-accent ring-4 ring-brand-accent/10' : 'border-brand-ink'} rounded-full flex items-center justify-center shadow-2xl transition-all duration-500">
            <div class="w-2 h-2 rounded-full ${isSelected ? 'bg-brand-accent animate-pulse' : 'bg-brand-ink'}"></div>
          </div>
          
          <!-- Bottom Indicator -->
          <div class="absolute -bottom-1 w-1 h-1 bg-brand-ink/20 rounded-full blur-[1px]"></div>
        </div>`,
  className: 'custom-marker',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20]
});

interface MapDisplayProps {
  activities: Activity[];
  isLoading?: boolean;
  selectedActivityIndex?: number | null;
  userLocation?: { lat: number, lng: number, area?: string } | null;
}

function ChangeView({ center, zoom = 13 }: { center: [number, number], zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, {
      duration: 1.5,
      easeLinearity: 0.25
    });
  }, [center, map, zoom]);
  return null;
}

// User location marker icon
const userLocationIcon = L.divIcon({
  html: `<div class="relative flex items-center justify-center">
          <div class="absolute w-6 h-6 bg-blue-500/30 rounded-full animate-pulse"></div>
          <div class="relative w-3 h-3 bg-blue-600 border-2 border-white rounded-full shadow-lg"></div>
        </div>`,
  className: 'user-marker',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

export default function MapDisplay({ activities, isLoading, selectedActivityIndex, userLocation }: MapDisplayProps) {
  const [activeMarker, setActiveMarker] = useState<number | null>(null);
  const [forceCenter, setForceCenter] = useState<[number, number] | null>(null);
  const markerRefs = React.useRef<{ [key: number]: L.Marker | null }>({});

  useEffect(() => {
    if (selectedActivityIndex !== undefined && selectedActivityIndex !== null) {
      setActiveMarker(selectedActivityIndex);
      // Programmatically open popup
      const marker = markerRefs.current[selectedActivityIndex];
      if (marker) {
        marker.openPopup();
      }
    }
  }, [selectedActivityIndex]);

  const validActivities = activities.filter(a => a.coordinates && !isNaN(a.coordinates.lat) && !isNaN(a.coordinates.lng));

  if (isLoading && validActivities.length === 0) {
    return (
      <div className="h-[400px] w-full editorial-border border overflow-hidden rounded-lg bg-brand-muted/5 flex flex-col items-center justify-center space-y-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-2 border-brand-accent/20 rounded-full"></div>
          <div className="absolute inset-0 border-2 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
        <div className="text-center space-y-1">
          <p className="text-[10px] uppercase tracking-[2px] font-bold text-brand-muted">Preparing Map</p>
          <p className="text-xs italic text-brand-muted/60">Plotting your curated route...</p>
        </div>
      </div>
    );
  }

  if (activities.length === 0) return null;
  
  if (validActivities.length === 0) return null;

  const center: [number, number] = activeMarker !== null && validActivities[activeMarker]
    ? [validActivities[activeMarker].coordinates.lat, validActivities[activeMarker].coordinates.lng]
    : [validActivities[0].coordinates.lat, validActivities[0].coordinates.lng];

  const polylinePositions: [number, number][] = validActivities.map(a => [a.coordinates.lat, a.coordinates.lng]);

  return (
    <div className="h-[400px] w-full editorial-border border overflow-hidden rounded-lg z-0 relative group">
      <MapContainer 
        center={center} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ChangeView center={forceCenter || center} zoom={activeMarker !== null || forceCenter ? 15 : 13} />
        
        {/* User Location Marker */}
        {userLocation && (
          <Marker 
            position={[userLocation.lat, userLocation.lng]} 
            icon={userLocationIcon}
          >
            <Popup>
              <div className="text-[10px] uppercase tracking-widest font-bold text-center">Your Location</div>
            </Popup>
          </Marker>
        )}

        {/* Route Polyline */}
        <Polyline 
          positions={polylinePositions} 
          pathOptions={{ 
            color: '#D4A373', 
            weight: 4, 
            opacity: 0.8,
            lineJoin: 'round',
            lineCap: 'round',
            dashArray: '1, 12' 
          }} 
        />

        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={40}
        >
          {validActivities.map((activity, i) => (
            <Marker 
              key={`${i}-${activity.name}`} 
              position={[activity.coordinates.lat, activity.coordinates.lng]}
              icon={createMarkerIcon(activeMarker === i)}
              ref={(ref) => {
                markerRefs.current[i] = ref;
              }}
              eventHandlers={{
                click: () => {
                  setActiveMarker(i);
                  // Force a center change on manual click as well
                  setForceCenter([activity.coordinates.lat, activity.coordinates.lng]);
                  setTimeout(() => setForceCenter(null), 1000);
                },
              }}
            >
              <Popup autoPan={true} className="premium-popup" closeButton={false}>
                <div className="p-2 min-w-[220px] font-sans">
                  <div className="flex justify-between items-start gap-3 mb-2">
                    <div className="space-y-0.5">
                      <span className="text-[8px] uppercase tracking-widest text-brand-muted font-bold block">Activity</span>
                      <h4 className="font-bold text-sm leading-tight text-brand-ink pr-2">{activity.name}</h4>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] uppercase tracking-widest text-brand-muted font-bold block">Spend</span>
                      <span className="text-[10px] font-bold text-brand-accent whitespace-nowrap">{activity.cost}</span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <span className="text-[8px] uppercase tracking-widest text-brand-muted font-bold block mb-1">Details</span>
                    <p className="text-[11px] text-brand-muted leading-relaxed line-clamp-3">{activity.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.name)}&query_place_id=${activity.coordinates.lat},${activity.coordinates.lng}`;
                        window.open(url, '_blank');
                      }}
                      className="bg-brand-muted/10 text-brand-ink py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-brand-muted/20 transition-all border border-brand-ink/5"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View Spot
                    </button>

                    {i < validActivities.length - 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const next = validActivities[i+1];
                          const url = `https://www.google.com/maps/dir/?api=1&origin=${activity.coordinates.lat},${activity.coordinates.lng}&destination=${next.coordinates.lat},${next.coordinates.lng}&travelmode=driving`;
                          window.open(url, '_blank');
                        }}
                        className="bg-brand-ink text-white py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-brand-accent transition-all duration-300 shadow-md shadow-brand-ink/10"
                      >
                        <Navigation className="w-3 h-3" />
                        Directions
                      </button>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
      
      {/* Zoom / Info Overlay */}
      <div className="absolute bottom-4 right-4 z-[400] flex flex-col gap-2 items-end">
        {userLocation && (
          <button
            onClick={() => {
              setForceCenter([userLocation.lat, userLocation.lng]);
              // Reset force center after flying so user can still interact
              setTimeout(() => setForceCenter(null), 2000);
            }}
            className="bg-white/90 backdrop-blur-sm p-3 rounded-full border editorial-border shadow-lg pointer-events-auto hover:bg-brand-accent hover:text-white transition-all duration-300 group/btn"
            title="Center on my location"
          >
            <LocateFixed className="w-4 h-4" />
          </button>
        )}
        <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full border editorial-border shadow-lg pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[9px] uppercase tracking-widest font-bold text-brand-muted italic">Click markers for directions</span>
        </div>
      </div>
    </div>
  );
}
