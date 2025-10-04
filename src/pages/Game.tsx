import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Crop, Location, AgentMessage, PlantHealth, GameLog } from '@/types/game';
import PlantVisualization from '@/components/PlantVisualization';
import AgentChat from '@/components/AgentChat';
import { Droplet, ThermometerSun, Leaf, TrendingUp, Play, Pause, FastForward } from 'lucide-react';

const Game = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as {
    mode: string;
    farmName: string;
    farmSize: string;
    location: Location;
    crop: Crop;
    startDate: string;
    harvestDate: string;
  } | null;

  const [currentDay, setCurrentDay] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(1000); // ms per day
  const [budget, setBudget] = useState(10000);
  const [waterReserve, setWaterReserve] = useState(100);
  const [envScore, setEnvScore] = useState(85);
  const [temperature, setTemperature] = useState(25);
  const [soilMoisture, setSoilMoisture] = useState(60);
  const [ndvi, setNdvi] = useState(0.65);
  const [plantHealth, setPlantHealth] = useState<PlantHealth>('good');
  const [showAgent, setShowAgent] = useState(true);
  const [agentMessages, setAgentMessages] = useState<AgentMessage[]>([]);
  const [activityLog, setActivityLog] = useState<GameLog[]>([]);

  useEffect(() => {
    if (!state) {
      navigate('/');
      return;
    }
    addAgentMessage(`🌱 Welcome to ${state.farmName}! Your ${state.crop.name} journey begins. I'll guide you with NASA satellite data!`, 'success');
    addActivityLog(`Day 1: ${state.crop.name} planting started at ${state.location.name}`, 'info');
  }, []);

  useEffect(() => {
    if (!isPaused && state && currentDay <= state.crop.growthDays) {
      const timer = setTimeout(() => {
        setCurrentDay(prev => prev + 1);
        simulateDay();
      }, speed);
      return () => clearTimeout(timer);
    } else if (state && currentDay > state.crop.growthDays) {
      // Game ended, navigate to results
      setTimeout(() => {
        navigate('/results', {
          state: {
            farmName: state.farmName,
            crop: state.crop,
            location: state.location,
            finalBudget: budget,
            envScore,
            quality: calculateQuality(),
            days: currentDay - 1
          }
        });
      }, 2000);
    }
  }, [currentDay, isPaused, speed]);

  const addAgentMessage = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setAgentMessages(prev => [...prev, { text: message, type, timestamp: Date.now() }]);
  };

  const addActivityLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setActivityLog(prev => [...prev, { message, type, day: currentDay }]);
  };

  const simulateDay = () => {
    // Simulate weather and conditions based on NASA data patterns
    const tempVariation = Math.random() * 10 - 5;
    const newTemp = Math.max(15, Math.min(40, temperature + tempVariation));
    setTemperature(newTemp);

    // Simulate soil moisture depletion
    const moistureLoss = Math.random() * 5 + 2;
    const newMoisture = Math.max(0, soilMoisture - moistureLoss);
    setSoilMoisture(newMoisture);

    // Update NDVI based on health
    const ndviChange = (newMoisture > 40 && newTemp > 20 && newTemp < 35) ? 0.02 : -0.01;
    const newNdvi = Math.max(0.3, Math.min(0.9, ndvi + ndviChange));
    setNdvi(newNdvi);

    // Calculate plant health
    const health = calculateHealth(newMoisture, newNdvi, newTemp);
    setPlantHealth(health);

    // Random events
    if (Math.random() < 0.15) {
      const events = [
        { msg: '🌧️ Rain detected by GPM satellite! +15% soil moisture', moisture: 15, type: 'success' as const },
        { msg: '☀️ Heat wave incoming! Temperature rising.', moisture: 0, type: 'warning' as const },
        { msg: '💧 SMAP shows low soil moisture. Consider irrigation!', moisture: 0, type: 'warning' as const },
        { msg: '🌿 MODIS shows excellent vegetation health!', moisture: 0, type: 'success' as const }
      ];
      const event = events[Math.floor(Math.random() * events.length)];
      addAgentMessage(event.msg, event.type);
      addActivityLog(event.msg, event.type);
      if (event.moisture > 0) {
        setSoilMoisture(prev => Math.min(100, prev + event.moisture));
      }
    }

    // Update environmental score
    const newEnvScore = Math.round((newMoisture * 0.3 + newNdvi * 100 * 0.4 + (100 - Math.abs(newTemp - 25)) * 0.3));
    setEnvScore(Math.max(0, Math.min(100, newEnvScore)));

    // Daily costs
    const dailyCost = 50;
    setBudget(prev => prev - dailyCost);
  };

  const calculateHealth = (moisture: number, ndviValue: number, temp: number): PlantHealth => {
    if (moisture >= 50 && ndviValue >= 0.7) return 'excellent';
    if (moisture >= 40 && ndviValue >= 0.6) return 'good';
    if (moisture >= 30 && ndviValue >= 0.5) return 'fair';
    if (moisture >= 20 && ndviValue >= 0.4) return 'poor';
    return 'critical';
  };

  const calculateQuality = () => {
    const moistureScore = soilMoisture / 100;
    const ndviScore = ndvi;
    const tempScore = state ? (Math.abs(temperature - (state.crop.optimalTemp[0] + state.crop.optimalTemp[1]) / 2) < 5 ? 1 : 0.7) : 0.7;
    return Math.round((moistureScore * 0.4 + ndviScore * 0.4 + tempScore * 0.2) * 100);
  };

  const handleAction = (action: string) => {
    switch (action) {
      case 'irrigate':
        if (budget >= 200) {
          setSoilMoisture(prev => Math.min(100, prev + 25));
          setBudget(prev => prev - 200);
          addAgentMessage('💧 Irrigation applied! Soil moisture increased.', 'success');
          addActivityLog('Irrigation system activated (-€200)', 'info');
          setEnvScore(prev => Math.max(0, prev - 5));
        } else {
          addAgentMessage('❌ Insufficient budget for irrigation!', 'error');
        }
        break;
      case 'fertilize':
        if (budget >= 300) {
          setNdvi(prev => Math.min(0.9, prev + 0.1));
          setBudget(prev => prev - 300);
          addAgentMessage('🌿 Fertilizer applied! Plant health improving.', 'success');
          addActivityLog('Organic fertilizer applied (-€300)', 'info');
          setEnvScore(prev => Math.max(0, prev - 3));
        } else {
          addAgentMessage('❌ Insufficient budget for fertilizer!', 'error');
        }
        break;
      case 'monitor':
        addAgentMessage(`📊 NASA Data: Moisture ${soilMoisture.toFixed(1)}%, NDVI ${ndvi.toFixed(2)}, Temp ${temperature.toFixed(1)}°C`, 'info');
        addActivityLog('Satellite data checked (free)', 'info');
        break;
      case 'wait':
        addAgentMessage('⏳ Letting nature take its course...', 'info');
        addActivityLog('No action taken this day', 'info');
        break;
    }
  };

  if (!state) return null;

  const progress = (currentDay / state.crop.growthDays) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-900 via-yellow-800 to-green-700 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-card/95 backdrop-blur rounded-xl shadow-lg p-4 mb-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-card-foreground">{state.farmName}</h1>
              <p className="text-sm text-muted-foreground">
                📍 {state.location.name} ({state.location.lat.toFixed(2)}°N, {state.location.lon.toFixed(2)}°E)
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">Day {currentDay}</p>
                <p className="text-xs text-muted-foreground">of {state.crop.growthDays}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className="p-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                >
                  {isPaused ? <Play size={20} /> : <Pause size={20} />}
                </button>
                <button
                  onClick={() => setSpeed(prev => prev === 1000 ? 500 : prev === 500 ? 250 : 1000)}
                  className="p-2 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition-opacity"
                >
                  <FastForward size={20} />
                  <span className="ml-1 text-xs">{speed === 1000 ? '1x' : speed === 500 ? '2x' : '4x'}</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-3">
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Panel - Stats */}
          <div className="space-y-4">
            <div className="bg-card/95 backdrop-blur rounded-xl shadow-lg p-4">
              <h3 className="font-bold text-card-foreground mb-3">Farm Metrics</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="text-primary" size={20} />
                    <span className="text-sm font-semibold">Budget</span>
                  </div>
                  <span className={`font-bold ${budget > 5000 ? 'text-primary' : 'text-destructive'}`}>
                    €{budget.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Droplet className="text-accent" size={20} />
                    <span className="text-sm font-semibold">Water Reserve</span>
                  </div>
                  <span className="font-bold text-accent">{waterReserve}%</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Leaf className="text-primary" size={20} />
                    <span className="text-sm font-semibold">Env. Score</span>
                  </div>
                  <span className="font-bold text-primary">{envScore}/100</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <ThermometerSun className="text-destructive" size={20} />
                    <span className="text-sm font-semibold">Temperature</span>
                  </div>
                  <span className="font-bold">{temperature.toFixed(1)}°C</span>
                </div>
              </div>
            </div>

            {/* NASA Satellite Data */}
            <div className="bg-card/95 backdrop-blur rounded-xl shadow-lg p-4">
              <h3 className="font-bold text-card-foreground mb-3 flex items-center gap-2">
                <span>🛰️</span> NASA Satellite Data
              </h3>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">SMAP Soil Moisture</span>
                    <span className="font-bold">{soilMoisture.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${soilMoisture > 60 ? 'bg-accent' : soilMoisture > 30 ? 'bg-primary' : 'bg-destructive'}`}
                      style={{ width: `${soilMoisture}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">MODIS NDVI</span>
                    <span className="font-bold">{ndvi.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${ndvi > 0.7 ? 'bg-primary' : ndvi > 0.5 ? 'bg-accent' : 'bg-destructive'}`}
                      style={{ width: `${ndvi * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Log */}
            <div className="bg-card/95 backdrop-blur rounded-xl shadow-lg p-4 max-h-64 overflow-y-auto">
              <h3 className="font-bold text-card-foreground mb-3">Activity Log</h3>
              <div className="space-y-2">
                {activityLog.slice(-5).reverse().map((log, idx) => (
                  <div key={idx} className={`text-xs p-2 rounded-lg ${
                    log.type === 'success' ? 'bg-primary/10 text-primary' :
                    log.type === 'warning' ? 'bg-accent/10 text-accent' :
                    log.type === 'error' ? 'bg-destructive/10 text-destructive' :
                    'bg-secondary/50'
                  }`}>
                    <span className="font-semibold">Day {log.day}:</span> {log.message}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center - Plant Visualization */}
          <div className="bg-card/95 backdrop-blur rounded-xl shadow-lg p-6 flex flex-col items-center justify-center">
            <PlantVisualization 
              health={plantHealth}
              day={currentDay}
              selectedCrop={state.crop}
            />
          </div>

          {/* Right Panel - Actions */}
          <div className="space-y-4">
            <div className="bg-card/95 backdrop-blur rounded-xl shadow-lg p-4">
              <h3 className="font-bold text-card-foreground mb-3">Farm Management Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleAction('irrigate')}
                  disabled={budget < 200}
                  className="p-3 bg-accent hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-accent-foreground rounded-lg transition-opacity text-sm font-semibold"
                >
                  💧 Irrigate
                  <span className="block text-xs">€200</span>
                </button>

                <button
                  onClick={() => handleAction('fertilize')}
                  disabled={budget < 300}
                  className="p-3 bg-primary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground rounded-lg transition-opacity text-sm font-semibold"
                >
                  🌿 Fertilize
                  <span className="block text-xs">€300</span>
                </button>

                <button
                  onClick={() => handleAction('monitor')}
                  className="p-3 bg-secondary hover:opacity-90 text-secondary-foreground rounded-lg transition-opacity text-sm font-semibold"
                >
                  📊 Monitor
                  <span className="block text-xs">Free</span>
                </button>

                <button
                  onClick={() => handleAction('wait')}
                  className="p-3 bg-muted hover:opacity-90 text-muted-foreground rounded-lg transition-opacity text-sm font-semibold"
                >
                  ⏳ Wait
                  <span className="block text-xs">No cost</span>
                </button>
              </div>
            </div>

            {/* Current Status */}
            <div className="bg-card/95 backdrop-blur rounded-xl shadow-lg p-4">
              <h3 className="font-bold text-card-foreground mb-3">Crop Status</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Crop Type</p>
                  <p className="font-bold text-card-foreground">{state.crop.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Plant Health</p>
                  <p className={`font-bold text-lg ${
                    plantHealth === 'excellent' ? 'text-primary' :
                    plantHealth === 'good' ? 'text-accent' :
                    plantHealth === 'fair' ? 'text-yellow-600' :
                    plantHealth === 'poor' ? 'text-orange-600' :
                    'text-destructive'
                  }`}>
                    {plantHealth.toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Expected Quality</p>
                  <p className="font-bold">{calculateQuality()}%</p>
                  <div className="w-full bg-muted rounded-full h-2 mt-1">
                    <div 
                      className="bg-gradient-to-r from-destructive via-accent to-primary h-2 rounded-full transition-all"
                      style={{ width: `${calculateQuality()}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AgentChat 
        showAgent={showAgent}
        setShowAgent={setShowAgent}
        agentMessages={agentMessages}
        mode={state.mode}
        screen="game"
      />
    </div>
  );
};

export default Game;
