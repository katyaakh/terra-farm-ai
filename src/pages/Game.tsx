import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Crop, Location, AgentMessage, PlantHealth, GameLog } from '@/types/game';
import PlantVisualization from '@/components/PlantVisualization';
import AgentChat from '@/components/AgentChat';
import { Droplet, Leaf, Zap } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

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
          return; // Don't advance day if action failed
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
          return; // Don't advance day if action failed
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

    // Advance to next day after action
    const nextDay = currentDay + 1;
    setCurrentDay(nextDay);
    
    // Simulate the day's conditions
    simulateDay();

    // Check if harvest is complete
    if (nextDay >= state.crop.growthDays) {
      const quality = calculateQuality();
      setTimeout(() => {
        navigate('/results', {
          state: {
            ...state,
            finalDay: nextDay,
            finalBudget: budget,
            finalEnvScore: envScore,
            quality,
            plantHealth
          }
        });
      }, 1000);
    }
  };

  if (!state) return null;

  const progress = (currentDay / state.crop.growthDays) * 100;

  return (
    <div className="h-screen w-full bg-gradient-to-b from-amber-900 via-yellow-800 to-green-700 flex flex-col overflow-hidden">
      {/* Fixed Header */}
      <div className="bg-card/95 backdrop-blur px-3 py-2 border-b">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-card-foreground truncate">{state.farmName}</h1>
            <p className="text-xs text-muted-foreground truncate">{state.location.name}</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-primary">Day {currentDay}</p>
            <p className="text-xs text-muted-foreground">of {state.crop.growthDays}</p>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-1.5">
          <div 
            className="bg-gradient-to-r from-primary to-accent h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Data Stats - Top */}
      <div className="bg-card/95 backdrop-blur px-3 py-2 border-b">
        <div className="grid grid-cols-2 gap-2">
          {/* NASA Data */}
          <div className="space-y-1.5">
            <div>
              <div className="flex justify-between text-xs mb-0.5">
                <span className="text-muted-foreground">Soil 💧</span>
                <span className="font-bold">{soilMoisture.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1">
                <div 
                  className={`h-1 rounded-full transition-all ${soilMoisture > 60 ? 'bg-accent' : soilMoisture > 30 ? 'bg-primary' : 'bg-destructive'}`}
                  style={{ width: `${soilMoisture}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-0.5">
                <span className="text-muted-foreground">NDVI 🌿</span>
                <span className="font-bold">{ndvi.toFixed(2)}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1">
                <div 
                  className={`h-1 rounded-full transition-all ${ndvi > 0.7 ? 'bg-primary' : ndvi > 0.5 ? 'bg-accent' : 'bg-destructive'}`}
                  style={{ width: `${ndvi * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Farm Metrics */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Budget</span>
              <span className={`text-xs font-bold ${budget > 5000 ? 'text-primary' : 'text-destructive'}`}>
                €{budget.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Quality</span>
              <span className="text-xs font-bold">{calculateQuality()}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Temp</span>
              <span className="text-xs font-bold">{temperature.toFixed(1)}°C</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-hidden">
        {/* Plant Visualization - Smaller */}
        <div className="w-48 h-48 flex items-center justify-center">
          <PlantVisualization 
            health={plantHealth}
            day={currentDay}
            selectedCrop={state.crop}
          />
        </div>

        {/* Compact Status */}
        <div className="mt-4 bg-card/95 backdrop-blur rounded-lg p-3 w-full max-w-sm">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Crop</p>
              <p className="font-bold text-sm">{state.crop.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Health</p>
              <p className={`font-bold text-sm ${
                plantHealth === 'excellent' ? 'text-primary' :
                plantHealth === 'good' ? 'text-accent' :
                plantHealth === 'fair' ? 'text-yellow-600' :
                'text-destructive'
              }`}>
                {plantHealth.toUpperCase()}
              </p>
            </div>
          </div>
        </div>

        {/* Actions Button */}
        <Sheet>
          <SheetTrigger asChild>
            <Button className="mt-4 w-full max-w-sm" size="lg">
              <Zap className="mr-2 w-5 h-5" />
              Farm Actions
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="bg-card/95 backdrop-blur border-t">
            <SheetHeader>
              <SheetTitle>Farm Management</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-2 gap-3 pt-4 pb-6">
              <button
                onClick={() => handleAction('irrigate')}
                disabled={budget < 200}
                className="p-4 bg-accent hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-accent-foreground rounded-lg transition-opacity font-semibold"
              >
                <div className="text-2xl mb-1">💧</div>
                <div className="text-sm">Irrigate</div>
                <div className="text-xs opacity-75">€200</div>
              </button>

              <button
                onClick={() => handleAction('fertilize')}
                disabled={budget < 300}
                className="p-4 bg-primary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground rounded-lg transition-opacity font-semibold"
              >
                <div className="text-2xl mb-1">🌿</div>
                <div className="text-sm">Fertilize</div>
                <div className="text-xs opacity-75">€300</div>
              </button>

              <button
                onClick={() => handleAction('monitor')}
                className="p-4 bg-secondary hover:opacity-90 text-secondary-foreground rounded-lg transition-opacity font-semibold"
              >
                <div className="text-2xl mb-1">📊</div>
                <div className="text-sm">Monitor</div>
                <div className="text-xs opacity-75">Free</div>
              </button>

              <button
                onClick={() => handleAction('wait')}
                className="p-4 bg-muted hover:opacity-90 text-muted-foreground rounded-lg transition-opacity font-semibold"
              >
                <div className="text-2xl mb-1">⏳</div>
                <div className="text-sm">Wait</div>
                <div className="text-xs opacity-75">No cost</div>
              </button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Activity Log Compact */}
        <div className="mt-4 w-full max-w-sm">
          <div className="bg-card/95 backdrop-blur rounded-lg p-2">
            <h3 className="font-bold text-xs mb-2 text-muted-foreground">Recent Activity</h3>
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {activityLog.slice(-3).reverse().map((log, idx) => (
                <div key={idx} className={`text-xs p-1.5 rounded ${
                  log.type === 'success' ? 'bg-primary/10 text-primary' :
                  log.type === 'warning' ? 'bg-accent/10 text-accent' :
                  log.type === 'error' ? 'bg-destructive/10 text-destructive' :
                  'bg-secondary/50'
                }`}>
                  <span className="font-semibold">D{log.day}:</span> {log.message}
                </div>
              ))}
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
