import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { locations } from '@/data/gameData';
import { Location } from '@/types/game';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import terraAvatar from '@/assets/terra-avatar.mp4';

const SetupLocation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const mode = location.state?.mode as string | null;
  
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        let locationName = `My Location`;
        let climate = 'Unknown';
        
        if (mapboxToken) {
          try {
            const response = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxToken}`
            );
            const data = await response.json();
            if (data.features && data.features.length > 0) {
              const place = data.features[0];
              locationName = place.place_name || `My Location`;
              const context = place.context || [];
              const region = context.find((c: any) => c.id.startsWith('region'))?.text || '';
              climate = region ? `Local climate (${region})` : 'Local climate';
            }
          } catch (error) {
            console.error('Reverse geocoding error:', error);
          }
        }

        const newLocation: Location = {
          lat: Number(latitude.toFixed(2)),
          lon: Number(longitude.toFixed(2)),
          name: locationName,
          climate: climate
        };

        setUserLocation(newLocation);
        setSelectedLocation(newLocation);
        setLoadingLocation(false);
        toast.success(`📍 Got your location: ${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°E`);
      },
      (error) => {
        setLoadingLocation(false);
        toast.error(`Location error: ${error.message}. Please enable location permissions.`);
      }
    );
  };

  const handleContinue = () => {
    if (!selectedLocation) {
      toast.error('Please select a location');
      return;
    }

    navigate('/setup/farm', {
      state: {
        mode,
        selectedLocation
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-900 via-yellow-800 to-amber-700 p-4 flex items-center overflow-y-auto">
      <div className="max-w-5xl mx-auto w-full">
        <div className="bg-card rounded-xl shadow-2xl p-6 animate-scale-in">
          <h2 className="text-2xl font-bold text-card-foreground mb-6 text-center flex items-center justify-center gap-2">
            <span>📊</span> Farm Setup
          </h2>

          {/* Avatar and Intro Message */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 items-center">
            <div className="flex justify-center">
              <div className="w-64 h-64 rounded-xl flex items-center justify-center overflow-hidden bg-transparent">
                <video 
                  src={terraAvatar} 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl p-6 border-2 border-primary/20">
              <p className="text-lg font-medium text-card-foreground leading-relaxed">
                Hello, I'm helping you setup - you can add your farm and cropping step by step
              </p>
            </div>
          </div>

          {/* Location Selection */}
          <div className="mb-6">
            <label className="block text-lg font-semibold text-card-foreground mb-4">Location *</label>
            
            {/* Use My Location Button */}
            <button
              type="button"
              onClick={getUserLocation}
              disabled={loadingLocation}
              className="w-full mb-4 p-4 rounded-lg border-2 border-primary bg-primary/10 hover:bg-primary/20 transition-all disabled:opacity-50"
            >
              <p className="font-bold text-primary text-base">
                {loadingLocation ? '📍 Getting your location...' : '📍 Use My Current Location'}
              </p>
              <p className="text-sm text-muted-foreground">Click to detect your coordinates</p>
            </button>

            {/* Location Dropdown */}
            <div className="space-y-2">
              <Select 
                value={selectedLocation?.name || ''} 
                onValueChange={(value) => {
                  const loc = locations.find(l => l.name === value) || userLocation;
                  if (loc) setSelectedLocation(loc);
                }}
              >
                <SelectTrigger className="w-full h-auto py-3 bg-card border-2 border-border hover:border-primary/50 transition-colors">
                  <SelectValue placeholder="Select a location from the list">
                    {selectedLocation && (
                      <div className="text-left">
                        <p className="font-bold text-card-foreground">{selectedLocation.name}</p>
                        <p className="text-xs text-muted-foreground">{selectedLocation.climate}</p>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-card border-2 border-border z-50">
                  {userLocation && (
                    <SelectItem value={userLocation.name} className="cursor-pointer hover:bg-secondary">
                      <div className="py-2">
                        <p className="font-bold text-card-foreground">📍 {userLocation.name}</p>
                        <p className="text-xs text-muted-foreground">{userLocation.climate}</p>
                        <p className="text-xs text-primary mt-1">{userLocation.lat}°N, {userLocation.lon}°E</p>
                      </div>
                    </SelectItem>
                  )}
                  {locations.map((loc) => (
                    <SelectItem key={loc.name} value={loc.name} className="cursor-pointer hover:bg-secondary">
                      <div className="py-2">
                        <p className="font-bold text-card-foreground">{loc.name}</p>
                        <p className="text-xs text-muted-foreground">{loc.climate}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleContinue}
            disabled={!selectedLocation}
            className="w-full py-6 text-lg font-semibold"
          >
            🚀 Continue to Farm Details
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SetupLocation;
