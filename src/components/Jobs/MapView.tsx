
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Job } from '@/types';
import { Card } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

interface MapViewProps {
  jobs: Job[];
}

const MapView: React.FC<MapViewProps> = ({ jobs }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markers = useRef<L.Marker[]>([]);

  const clearMarkers = () => {
    markers.current.forEach(marker => marker.remove());
    markers.current = [];
  };

  const addMarkers = () => {
    if (!map.current) return;
    
    clearMarkers();
    
    jobs.forEach(job => {
      if (!job.latitude || !job.longitude) return;
      
      const marker = L.marker([job.latitude, job.longitude], {
        icon: L.divIcon({
          className: 'bg-primary rounded-full w-4 h-4 -ml-2 -mt-2',
          iconSize: [16, 16],
        })
      });
      
      const popupContent = document.createElement('div');
      popupContent.className = 'p-2';
      popupContent.innerHTML = `
        <h3 class="font-medium">${job.title}</h3>
        <p class="text-sm">${job.location}</p>
        <p class="text-xs mt-1">${job.budget ? `Budget: $${job.budget}` : ''}</p>
        <button class="bg-primary text-white px-2 py-1 rounded text-xs mt-2">View Details</button>
      `;
      
      const popup = L.popup().setContent(popupContent);
      marker.bindPopup(popup);
      
      marker.addTo(map.current);
      markers.current.push(marker);
      
      // Add click handler for the button
      const button = popupContent.querySelector('button');
      if (button) {
        button.addEventListener('click', () => {
          window.location.href = `/jobs/${job.id}`;
        });
      }
    });
  };

  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    
    // Initialize map
    map.current = L.map(mapContainer.current).setView([39.8283, -98.5795], 3);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map.current);
    
    // Add markers
    addMarkers();
    
    // Cleanup
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);
  
  useEffect(() => {
    if (map.current) {
      addMarkers();
    }
  }, [jobs]);
  
  return (
    <div className="h-[600px] w-full relative">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg" />
      <div className="absolute top-4 left-4 z-10 w-80">
        <div className="bg-white p-2 rounded-md shadow-lg">
          <h3 className="font-medium mb-2 flex items-center">
            <MapPin className="mr-2 h-4 w-4 text-primary" />
            <span>Job Locations</span>
          </h3>
          <p className="text-sm text-muted-foreground mb-2">
            {jobs.length} jobs available on the map
          </p>
        </div>
      </div>
    </div>
  );
};

export default MapView;
