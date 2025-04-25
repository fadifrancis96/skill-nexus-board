
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Job } from '@/types';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search } from 'lucide-react';

interface MapViewProps {
  jobs: Job[];
}

const MapView: React.FC<MapViewProps> = ({ jobs }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [apiKey, setApiKey] = useState<string>('');
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const navigate = useNavigate();

  const clearMarkers = () => {
    markers.current.forEach(marker => marker.remove());
    markers.current = [];
  };

  const addMarkers = () => {
    if (!map.current) return;
    
    clearMarkers();
    
    jobs.forEach(job => {
      if (!job.latitude || !job.longitude) return;
      
      // Create popup content
      const popupContent = document.createElement('div');
      popupContent.className = 'p-2';
      popupContent.innerHTML = `
        <h3 class="font-medium">${job.title}</h3>
        <p class="text-sm">${job.location}</p>
        <p class="text-xs mt-1">${job.budget ? `Budget: $${job.budget}` : ''}</p>
      `;
      
      // Create a button in the popup
      const button = document.createElement('button');
      button.className = 'bg-primary text-white px-2 py-1 rounded text-xs mt-2';
      button.innerText = 'View Details';
      button.addEventListener('click', () => {
        navigate(`/jobs/${job.id}`);
      });
      popupContent.appendChild(button);
      
      // Create a popup
      const popup = new mapboxgl.Popup({ offset: 25 }).setDOMContent(popupContent);
      
      // Create a marker
      const marker = new mapboxgl.Marker({ color: '#F97316' })
        .setLngLat([job.longitude, job.latitude])
        .setPopup(popup)
        .addTo(map.current);
        
      markers.current.push(marker);
    });
  };

  useEffect(() => {
    // Check if there's an API key in localStorage
    const storedKey = localStorage.getItem('mapbox_key');
    if (storedKey) {
      setApiKey(storedKey);
      setHasApiKey(true);
    }
  }, []);

  useEffect(() => {
    if (!hasApiKey || !mapContainer.current) return;
    
    mapboxgl.accessToken = apiKey;
    
    if (map.current) return;
    
    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-98.5795, 39.8283], // Center of USA as default
      zoom: 3
    });
    
    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    
    // Add geolocate control
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true
      }),
      'top-right'
    );
    
    // When the map loads, add markers
    map.current.on('load', () => {
      addMarkers();
    });
    
    // Cleanup
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [hasApiKey, apiKey]);
  
  useEffect(() => {
    if (map.current && hasApiKey) {
      addMarkers();
    }
  }, [jobs, hasApiKey]);
  
  const handleSubmitApiKey = () => {
    // Add validation for API key format
    const apiKeyRegex = /^pk\.[a-zA-Z0-9]+\.[a-zA-Z0-9]+$/;
    
    if (!apiKeyRegex.test(apiKey)) {
      alert('Please enter a valid Mapbox public access token');
      return;
    }

    localStorage.setItem('mapbox_key', apiKey);
    setHasApiKey(true);
  };
  
  if (!hasApiKey) {
    return (
      <Card className="p-6 max-w-md mx-auto">
        <h2 className="text-xl font-bold mb-4">Mapbox API Key Required</h2>
        <p className="mb-4">To view jobs on a map, you need to provide a Mapbox API key.</p>
        <ol className="list-decimal pl-5 mb-4 space-y-2">
          <li>Go to <a href="https://www.mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Mapbox.com</a> and create an account</li>
          <li>Get your public access token from your Mapbox account dashboard</li>
          <li>Enter it below to enable the map</li>
        </ol>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter Mapbox API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <Button onClick={handleSubmitApiKey}>Submit</Button>
        </div>
      </Card>
    );
  }
  
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
