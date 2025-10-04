import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { locations, crops } from '@/data/gameData';
import { Crop, Location, AgentMessage } from '@/types/game';
import AgentChat from '@/components/AgentChat';

const Setup = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const mode = location.state?.mode as string | null;
  
  const [farmName, setFarmName] = useState('');
  const [farmSize, setFarmSize] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [harvestDate, setHarvestDate] = useState('');
  const [showAgent, setShowAgent] = useState(true);
  const [agentMessages, setAgentMessages] = useState<AgentMessage[]>([]);

  const addAgentMessage = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setAgentMessages(prev => [...prev, { text: message, type, timestamp: Date.now() }]);
  };

  useEffect(() => {
    if (!mode) {
      navigate('/');
      return;
    }
    addAgentMessage(mode === 'simulation' 
      ? "Great choice! Let's set up your simulation with historical NASA data. First, tell me about your farm!" 
      : "Perfect! Let's connect your real farm data with NASA satellites for daily monitoring and forecasts!", 
      'success'
    );
  }, [mode, navigate]);

  useEffect(() => {
    if (selectedCrop && (startDate || mode === 'simulation')) {
      const baseDate = mode === 'monitoring' ? new Date(startDate) : new Date();
      const harvestDay = new Date(baseDate);
      harvestDay.setDate(harvestDay.getDate() + selectedCrop.growthDays);
      setHarvestDate(harvestDay.toISOString().split('T')[0]);
    }
  }, [selectedCrop, startDate, mode]);

  const handleStart = () => {
    if (farmName && farmSize && selectedLocation && selectedCrop) {
      navigate('/game', {
        state: {
          mode,
          farmName,
          farmSize,
          location: selectedLocation,
          crop: selectedCrop,
          startDate,
          harvestDate
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-900 via-yellow-800 to-amber-700 p-4 flex items-center overflow-y-auto">
      <div className="max-w-5xl mx-auto w-full">
        <div className="bg-card rounded-xl shadow-2xl p-6 animate-scale-in">
          <h2 className="text-2xl font-bold text-card-foreground mb-4 text-center">
            {mode === 'simulation' ? '🎮 Game Setup' : '📊 Farm Setup'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-card-foreground mb-2">Location *</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {locations.map((loc) => (
                <button
                  key={loc.name}
                  onClick={() => setSelectedLocation(loc)}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    selectedLocation?.name === loc.name 
                      ? 'border-primary bg-secondary' 
                      : 'border-border bg-card hover:border-primary/50'
                  }`}
                >
                  <p className="font-bold text-card-foreground text-sm">{loc.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{loc.climate}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-card-foreground mb-2">Crop *</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {crops.map((crop) => (
                <button
                  key={crop.id}
                  onClick={() => {
                    setSelectedCrop(crop);
                    const baseDate = mode === 'monitoring' ? new Date(startDate) : new Date();
                    const harvestDay = new Date(baseDate);
                    harvestDay.setDate(harvestDay.getDate() + crop.growthDays);
                    addAgentMessage(`📅 Great! ${crop.name} takes ${crop.growthDays} days to grow. Expected harvest: ${harvestDay.toLocaleDateString()}`, 'info');
                  }}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedCrop?.id === crop.id 
                      ? 'border-primary bg-secondary' 
                      : 'border-border bg-card hover:border-primary/50'
                  }`}
                >
                  <p className="font-bold text-card-foreground text-sm mb-1">{crop.name}</p>
                  <p className="text-xs text-muted-foreground">{crop.growthDays} days</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {mode === 'monitoring' && (
              <div>
                <label className="block text-sm font-semibold text-card-foreground mb-2">Start Date *</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (selectedCrop) {
                      const harvestDay = new Date(e.target.value);
                      harvestDay.setDate(harvestDay.getDate() + selectedCrop.growthDays);
                      addAgentMessage(`📅 Updated! With this start date, your ${selectedCrop.name} will be ready on ${harvestDay.toLocaleDateString()}`, 'info');
                    }
                  }}
                  className="w-full p-3 text-sm border-2 border-input bg-background text-foreground rounded-lg focus:border-primary focus:outline-none transition-colors"
                />
              </div>
            )}

            <div className={mode === 'monitoring' ? '' : 'col-span-2'}>
              <label className="block text-sm font-semibold text-card-foreground mb-2">
                Expected Harvest Date 
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
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleStart}
            disabled={!farmName || !farmSize || !selectedLocation || !selectedCrop}
            className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground py-3 px-6 rounded-lg font-bold text-base transition-all shadow-lg"
          >
            {mode === 'simulation' ? '🚀 Start Simulation' : '📡 Start Monitoring'}
          </button>
        </div>
      </div>
      <AgentChat 
        showAgent={showAgent}
        setShowAgent={setShowAgent}
        agentMessages={agentMessages}
        mode={mode}
        screen="setup"
      />
    </div>
  );
};

export default Setup;
