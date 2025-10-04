import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Crop, Location, AgentMessage, PlantHealth, GameLog } from '@/types/game';
import PlantVisualization from '@/components/PlantVisualization';
import AgentChat from '@/components/AgentChat';
import { Droplet, Leaf, Zap } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

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
  const [historicalWeather, setHistoricalWeather] = useState<any[]>([]);
  const [weatherLoaded, setWeatherLoaded] = useState(false);

  // Fetch historical weather data on component mount
  useEffect(() => {
    if (!state) {
      navigate('/');
      return;
    }
    
    addAgentMessage(`🌱 Welcome to ${state.farmName}! Your ${state.crop.name} journey begins. I'll guide you with NASA satellite data!`, 'success');
    addActivityLog(`Day 1: ${state.crop.name} planting started at ${state.location.name}`, 'info');
    
    // Fetch real historical weather data
    fetchHistoricalWeatherData();
  }, []);

  const fetchHistoricalWeatherData = async () => {
    if (!state) return;
    
    try {
      addAgentMessage('📡 Fetching real NASA historical weather data...', 'info');
      
      const { data, error } = await supabase.functions.invoke('fetch-weather-data', {
        body: {
          lat: state.location.lat,
          lon: state.location.lon,
          start_date: state.startDate,
          end_date: state.harvestDate,
          mode: 'history'
        }
      });

      if (error) {
        console.error('Weather data error:', error);
        addAgentMessage(`❌ Error fetching weather data: ${error.message}`, 'error');
        return;
      }

      if (data?.data) {
        console.log('Historical weather data received:', data.data);
        setHistoricalWeather(data.data);
        setWeatherLoaded(true);
        
        // Set initial conditions from first day
        if (data.data.length > 0) {
          const firstDay = data.data[0];
          setTemperature((firstDay.Tmax_C + firstDay.Tmin_C) / 2);
          setSoilMoisture(firstDay.Rain_mm > 5 ? 80 : 60);
          addAgentMessage(`✅ Loaded ${data.data.length} days of real NASA weather data from ${state.startDate} to ${state.harvestDate}`, 'success');
        }
      }
    } catch (error) {
      console.error('Error fetching weather data:', error);
      addAgentMessage(`❌ Failed to fetch weather data: ${error}`, 'error');
    }
  };


  const addAgentMessage = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setAgentMessages(prev => [...prev, { text: message, type, timestamp: Date.now() }]);
  };

  const addActivityLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setActivityLog(prev => [...prev, { message, type, day: currentDay }]);
  };

  const fetchSatelliteData = async () => {
    if (!state) return;
    
    try {
      addAgentMessage('🛰️ Fetching real NASA satellite data...', 'info');
      
      // Calculate date range (last 30 days)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const { data, error } = await supabase.functions.invoke('fetch-satellite-data', {
        body: {
          lat: state.location.lat,
          lon: state.location.lon,
          extent_m: 1000, // 1km square area
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          datasets: ['ndvi', 'lst', 'smap']
        }
      });

      if (error) {
        console.error('Satellite data error:', error);
        addAgentMessage(`❌ Error fetching satellite data: ${error.message}`, 'error');
        return;
      }

      if (data) {
        console.log('Satellite data received:', data);
        
        // Update game state with real data if available
        if (data.datasets?.ndvi?.values?.length > 0) {
          const latestNdvi = data.datasets.ndvi.values[data.datasets.ndvi.values.length - 1].value;
          setNdvi(latestNdvi);
          addAgentMessage(`📡 Real MODIS NDVI: ${latestNdvi.toFixed(2)}`, 'success');
        }
        
        if (data.datasets?.smap?.values?.length > 0) {
          const latestSoilMoisture = data.datasets.smap.values[data.datasets.smap.values.length - 1].value * 100;
          setSoilMoisture(latestSoilMoisture);
          addAgentMessage(`💧 Real SMAP Soil Moisture: ${latestSoilMoisture.toFixed(1)}%`, 'success');
        }
        
        if (data.datasets?.lst?.values?.length > 0) {
          const latestLST = data.datasets.lst.values[data.datasets.lst.values.length - 1].value;
          const celsiusTemp = latestLST * 0.02 - 273.15;
          setTemperature(celsiusTemp);
          addAgentMessage(`🌡️ Real MODIS Temperature: ${celsiusTemp.toFixed(1)}°C`, 'success');
        }
      }
    } catch (error) {
      console.error('Error fetching satellite data:', error);
      addAgentMessage(`❌ Failed to fetch satellite data: ${error}`, 'error');
    }
  };

  const simulateDay = () => {
    // Use real historical weather data if available
    let newTemp = temperature;
    let newMoisture = soilMoisture;
    
    if (weatherLoaded && historicalWeather.length > 0) {
      const dayIndex = Math.min(currentDay - 1, historicalWeather.length - 1);
      const dayWeather = historicalWeather[dayIndex];
      
      // Use real NASA weather data
      newTemp = (dayWeather.Tmax_C + dayWeather.Tmin_C) / 2;
      setTemperature(newTemp);
      
      // Update soil moisture based on real rainfall
      if (dayWeather.Rain_mm > 0) {
        newMoisture = Math.min(100, soilMoisture + dayWeather.Rain_mm * 2);
        addAgentMessage(`🌧️ Real NASA data: ${dayWeather.Rain_mm.toFixed(1)}mm rainfall detected!`, 'success');
        addActivityLog(`Rain: ${dayWeather.Rain_mm.toFixed(1)}mm (NASA POWER data)`, 'info');
      } else {
        // Natural depletion
        newMoisture = Math.max(0, soilMoisture - 3);
      }
      setSoilMoisture(newMoisture);
      
      addAgentMessage(`🌡️ Real weather: Temp ${newTemp.toFixed(1)}°C, Rain ${dayWeather.Rain_mm.toFixed(1)}mm, RH ${dayWeather.RH_pct.toFixed(0)}%`, 'info');
    } else {
      // Fallback to simulated weather if no real data
      const tempVariation = Math.random() * 10 - 5;
      newTemp = Math.max(15, Math.min(40, temperature + tempVariation));
      setTemperature(newTemp);
      
      const moistureLoss = Math.random() * 5 + 2;
      newMoisture = Math.max(0, soilMoisture - moistureLoss);
      setSoilMoisture(newMoisture);
    }

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
        // Fetch real satellite data
        fetchSatelliteData();
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
