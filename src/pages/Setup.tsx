import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { crops } from '@/data/gameData';
import { Crop, Location } from '@/types/game';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Droplet, TrendingUp, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import terraAvatar from '@/assets/terra-avatar.mp4';

interface Farm {
  id: string;
  farm_name: string;
  farm_size: number;
  created_at: string;
}

const Setup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const mode = location.state?.mode as string | null;
  const selectedLocation = location.state?.selectedLocation as Location | null;
  const { user } = useAuth();
  
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const [newFarmName, setNewFarmName] = useState('');
  const [newFarmSize, setNewFarmSize] = useState('');
  const [isNewFarmDialogOpen, setIsNewFarmDialogOpen] = useState(false);
  
  const [farmName, setFarmName] = useState('');
  const [farmSize, setFarmSize] = useState('');
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);
  
  const getDefaultStartDate = () => {
    const date = new Date();
    if (!mode || mode === 'simulation') {
      date.setDate(date.getDate() - 90);
    }
    return date.toISOString().split('T')[0];
  };
  
  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [harvestDate, setHarvestDate] = useState('');
  
  const setupMessage = "Let's add the crop you want to grow and choose the period - pay attention that's based on the past data!";
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex <= setupMessage.length) {
        setDisplayedText(setupMessage.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
      }
    }, 30);
    
    return () => clearInterval(typingInterval);
  }, []);

  useEffect(() => {
    if (!selectedLocation) {
      navigate('/setup');
      return;
    }
    
    if (user) {
      loadFarms();
    }
  }, [selectedLocation, navigate, user]);

  const loadFarms = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('farms')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading farms:', error);
      return;
    }

    setFarms(data || []);
    if (data && data.length > 0 && !selectedFarmId) {
      setSelectedFarmId(data[0].id);
      const farm = data[0];
      setFarmName(farm.farm_name);
      setFarmSize(farm.farm_size.toString());
    }
  };

  const createNewFarm = async () => {
    if (!user) {
      toast.error('Please log in to create a farm');
      return;
    }

    if (!newFarmName.trim() || !newFarmSize) {
      toast.error('Please enter farm name and size');
      return;
    }

    const { data, error } = await supabase
      .from('farms')
      .insert({
        user_id: user.id,
        farm_name: newFarmName.trim(),
        farm_size: parseFloat(newFarmSize)
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating farm:', error);
      toast.error('Failed to create farm');
      return;
    }

    toast.success('Farm created successfully!');
    setFarms([data, ...farms]);
    setSelectedFarmId(data.id);
    setFarmName(data.farm_name);
    setFarmSize(data.farm_size.toString());
    setNewFarmName('');
    setNewFarmSize('');
    setIsNewFarmDialogOpen(false);
  };

  const handleFarmChange = (farmId: string) => {
    setSelectedFarmId(farmId);
    const farm = farms.find(f => f.id === farmId);
    if (farm) {
      setFarmName(farm.farm_name);
      setFarmSize(farm.farm_size.toString());
    }
  };

  useEffect(() => {
    if (selectedCrop && startDate) {
      const baseDate = new Date(startDate);
      const harvestDay = new Date(baseDate);
      harvestDay.setDate(harvestDay.getDate() + selectedCrop.growthDays);
      setHarvestDate(harvestDay.toISOString().split('T')[0]);
    }
  }, [selectedCrop, startDate]);

  const handleStart = async () => {
    if (farmName && farmSize && selectedLocation && selectedCrop) {
      let gameSessionId = null;
      
      // If user is logged in, save farm and create game session
      if (user) {
        try {
          const { data, error } = await supabase.from('game_sessions').insert({
            user_id: user.id,
            farm_id: selectedFarmId || null,
            location: selectedLocation.name,
            latitude: selectedLocation.lat,
            longitude: selectedLocation.lon,
            crop_type: selectedCrop.name,
            start_date: startDate,
            current_day: 0,
            water_reserve: 100,
            budget: 10000,
            env_score: 100,
          }).select().single();

          if (error) throw error;
          gameSessionId = data?.id;
        } catch (error) {
          console.error('Error creating game session:', error);
          toast.error('Failed to save game session');
        }
      }

      navigate('/game', {
        state: {
          mode,
          farmName,
          farmSize,
          location: selectedLocation,
          crop: selectedCrop,
          startDate,
          harvestDate,
          gameSessionId
        }
      });
    }
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
                {displayedText}
                <span className="animate-pulse">|</span>
              </p>
            </div>
          </div>

          {user && farms.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-card-foreground mb-2">Select Farm</label>
              <div className="flex gap-2">
                <Select value={selectedFarmId} onValueChange={handleFarmChange}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a farm" />
                  </SelectTrigger>
                  <SelectContent>
                    {farms.map((farm) => (
                      <SelectItem key={farm.id} value={farm.id}>
                        {farm.farm_name} - {farm.farm_size} hectares
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Dialog open={isNewFarmDialogOpen} onOpenChange={setIsNewFarmDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Farm</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div>
                        <label className="block text-sm font-semibold text-card-foreground mb-2">Farm Name</label>
                        <input
                          type="text"
                          value={newFarmName}
                          onChange={(e) => setNewFarmName(e.target.value)}
                          placeholder="e.g., Green Valley Farm"
                          className="w-full p-3 text-sm border-2 border-input bg-background text-foreground rounded-lg focus:border-primary focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-card-foreground mb-2">Farm Size (hectares)</label>
                        <input
                          type="number"
                          value={newFarmSize}
                          onChange={(e) => setNewFarmSize(e.target.value)}
                          placeholder="e.g., 10"
                          min="0.1"
                          step="0.1"
                          className="w-full p-3 text-sm border-2 border-input bg-background text-foreground rounded-lg focus:border-primary focus:outline-none"
                        />
                      </div>
                      <Button onClick={createNewFarm} className="w-full">
                        Create Farm
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          )}

          {user && farms.length === 0 && (
            <div className="mb-4 p-4 bg-muted rounded-lg border border-border">
              <p className="text-sm text-muted-foreground mb-3">You don't have any farms yet. Create your first farm!</p>
              <Dialog open={isNewFarmDialogOpen} onOpenChange={setIsNewFarmDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Farm
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Farm</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <label className="block text-sm font-semibold text-card-foreground mb-2">Farm Name</label>
                      <input
                        type="text"
                        value={newFarmName}
                        onChange={(e) => setNewFarmName(e.target.value)}
                        placeholder="e.g., Green Valley Farm"
                        className="w-full p-3 text-sm border-2 border-input bg-background text-foreground rounded-lg focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-card-foreground mb-2">Farm Size (hectares)</label>
                      <input
                        type="number"
                        value={newFarmSize}
                        onChange={(e) => setNewFarmSize(e.target.value)}
                        placeholder="e.g., 10"
                        min="0.1"
                        step="0.1"
                        className="w-full p-3 text-sm border-2 border-input bg-background text-foreground rounded-lg focus:border-primary focus:outline-none"
                      />
                    </div>
                    <Button onClick={createNewFarm} className="w-full">
                      Create Farm
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {!user && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-card-foreground mb-2">Farm Name *</label>
                  <input
                    type="text"
                    value={farmName}
                    onChange={(e) => setFarmName(e.target.value)}
                    placeholder="e.g., Green Valley Farm"
                    className="w-full p-3 text-sm border-2 border-input bg-background text-foreground rounded-lg focus:border-primary focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-card-foreground mb-2">Farm Size (hectares) *</label>
                  <input
                    type="number"
                    value={farmSize}
                    onChange={(e) => setFarmSize(e.target.value)}
                    placeholder="e.g., 50"
                    className="w-full p-3 text-sm border-2 border-input bg-background text-foreground rounded-lg focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
              </>
            )}
          </div>

          {/* Selected Location Display */}
          <div className="mb-6 p-4 bg-secondary/30 rounded-lg border border-primary/20">
            <label className="block text-sm font-semibold text-card-foreground mb-2">Selected Location</label>
            <p className="font-bold text-card-foreground">{selectedLocation?.name}</p>
            <p className="text-xs text-muted-foreground">{selectedLocation?.climate}</p>
            <p className="text-xs text-primary mt-1">{selectedLocation?.lat}°N, {selectedLocation?.lon}°E</p>
          </div>

          {/* Crop Selection as Cards */}
          <div className="mb-6">
            <label className="block text-lg font-semibold text-card-foreground mb-4">Crop *</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {crops.map((crop) => (
                <button
                  key={crop.id}
                  onClick={() => setSelectedCrop(crop)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedCrop?.id === crop.id 
                      ? 'border-primary bg-secondary shadow-lg' 
                      : 'border-border bg-card hover:border-primary/50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-card-foreground text-base mb-1">{crop.name}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {crop.growthDays} days
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">{crop.marketPricing.basePrice}{crop.marketPricing.unit}</p>
                      <p className="text-xs text-muted-foreground">Base price</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-background/50 p-2 rounded">
                      <p className="text-muted-foreground flex items-center gap-1 mb-1">
                        <Droplet className="w-3 h-3" />
                        Water Need
                      </p>
                      <p className="font-semibold text-card-foreground">{crop.waterNeed}</p>
                    </div>
                    <div className="bg-background/50 p-2 rounded">
                      <p className="text-muted-foreground flex items-center gap-1 mb-1">
                        <TrendingUp className="w-3 h-3" />
                        Revenue/ha
                      </p>
                      <p className="font-semibold text-card-foreground">€{crop.marketPricing.pricePerHectare}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-xs text-muted-foreground">
                      Drought Tolerance: <span className="font-semibold text-card-foreground">{crop.droughtTolerance}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Demand: <span className="font-semibold text-primary">{crop.marketPricing.demandLevel}</span>
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-card-foreground mb-2">
                {mode === 'simulation' ? 'Planting Date (Historical) *' : 'Start Date *'}
              </label>
              <input
                type="date"
                value={startDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (selectedCrop) {
                    const harvestDay = new Date(e.target.value);
                    harvestDay.setDate(harvestDay.getDate() + selectedCrop.growthDays);
                    const harvestDateStr = harvestDay.toISOString().split('T')[0];
                    const today = new Date().toISOString().split('T')[0];
                    
                    if (harvestDateStr > today && mode === 'simulation') {
                      toast.warning('⚠️ Harvest date would be in the future. For simulation, both dates must be in the past to use real historical data.');
                    }
                  }
                }}
                className="w-full p-3 text-sm border-2 border-input bg-background text-foreground rounded-lg focus:border-primary focus:outline-none transition-colors"
              />
              {mode === 'simulation' && (
                <p className="text-xs text-muted-foreground mt-1">
                  📆 Must be in the past to use real NASA historical data
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-card-foreground mb-2">
                {mode === 'simulation' ? 'Harvest Date (Historical)' : 'Expected Harvest Date'}
                {selectedCrop && (
                  <span className="text-primary ml-1">
                    (Auto: +{selectedCrop.growthDays} days)
                  </span>
                )}
              </label>
              <input
                type="date"
                value={harvestDate}
                readOnly
                disabled
                className="w-full p-3 text-sm border-2 border-primary/30 bg-secondary rounded-lg cursor-not-allowed"
                placeholder={selectedCrop ? `${selectedCrop.growthDays} days from start` : 'Select crop first'}
              />
              {selectedCrop && harvestDate && (
                <p className="text-xs text-primary mt-1">
                  📅 {new Date(harvestDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {new Date(harvestDate) > new Date() && mode === 'simulation' && (
                    <span className="text-destructive ml-2">⚠️ Future date!</span>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Show selected crop parameters before starting */}
          {selectedCrop && (
            <div className="mb-6 p-4 bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg border-2 border-primary/20">
              <h3 className="font-bold text-card-foreground mb-3 flex items-center gap-2">
                <span>🌱</span> Selected Crop Summary
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Growth Period</p>
                  <p className="font-bold text-card-foreground">{selectedCrop.growthDays} days</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Base Price</p>
                  <p className="font-bold text-primary">{selectedCrop.marketPricing.basePrice}{selectedCrop.marketPricing.unit}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Water Need</p>
                  <p className="font-bold text-card-foreground">{selectedCrop.waterNeed}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Revenue/ha</p>
                  <p className="font-bold text-primary">€{selectedCrop.marketPricing.pricePerHectare}</p>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleStart}
            disabled={!farmName || !farmSize || !selectedLocation || !selectedCrop}
            className="w-full py-6 text-lg font-semibold"
          >
            🚀 Start Simulation
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Setup;
