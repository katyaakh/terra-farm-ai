import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Crop, Location, AgentMessage, PlantHealth, GameLog } from '@/types/game';
import PlantVisualization from '@/components/PlantVisualization';
import FullWidthChat from '@/components/FullWidthChat';
import { Droplet, Leaf, Zap, Upload, Satellite, Info, TrendingUp, Thermometer } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import RealMonitoring from '@/components/RealMonitoring';

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
    gameSessionId?: string;
  } | null;

  const [currentDay, setCurrentDay] = useState(1);
  const [budget, setBudget] = useState(10000);
  const [waterReserve, setWaterReserve] = useState(100);
  const [envScore, setEnvScore] = useState(85);
  const [temperature, setTemperature] = useState(25);
  const [soilMoisture, setSoilMoisture] = useState(60);
  const [ndvi, setNdvi] = useState(0.65);
  const [plantHealth, setPlantHealth] = useState<PlantHealth>('good');
  const [agentMessages, setAgentMessages] = useState<AgentMessage[]>([]);
  const [activityLog, setActivityLog] = useState<GameLog[]>([]);
  const [historicalWeather, setHistoricalWeather] = useState<any[]>([]);
  const [weatherLoaded, setWeatherLoaded] = useState(false);
  const [satelliteDataLoaded, setSatelliteDataLoaded] = useState(false);
  const [dataSource, setDataSource] = useState<'MODIS_REAL' | 'MODIS_SIMULATED' | null>(null);
  const [showFallbackButton, setShowFallbackButton] = useState(false);
  const [isGeneratingSynthetic, setIsGeneratingSynthetic] = useState(false);
  const [dataCheckAttempts, setDataCheckAttempts] = useState(0);
  const { toast } = useToast();
  const [showNasaInfo, setShowNasaInfo] = useState(false);

  // Fetch historical weather and satellite data on component mount
  useEffect(() => {
    if (!state) {
      navigate('/');
      return;
    }
    
    addAgentMessage(`🌱 Welcome to ${state.farmName}! Your ${state.crop.name} journey begins. I'll guide you with NASA satellite data!`, 'success');
    addActivityLog(`Day 1: ${state.crop.name} planting started at ${state.location.name}`, 'info');
    
    // Fetch real historical weather data
    fetchHistoricalWeatherData();
    
    // Fetch and store satellite data if game session exists
    if (state.gameSessionId) {
      fetchAndStoreSatelliteData();
    }
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

  const checkForRealData = async (): Promise<boolean> => {
    if (!state?.gameSessionId) return false;
    
    try {
      const { data, error } = await supabase
        .from('satellite_data')
        .select('data_source')
        .eq('game_session_id', state.gameSessionId)
        .eq('data_source', 'MODIS_REAL')
        .limit(1);
      
      if (error) {
        console.error('Error checking for real data:', error);
        return false;
      }
      
      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking for real data:', error);
      return false;
    }
  };

  const fetchAndStoreSatelliteData = async (forceSynthetic = false) => {
    if (!state || !state.gameSessionId) return;
    
    try {
      if (!forceSynthetic) {
        addAgentMessage('🛰️ Checking for uploaded satellite data...', 'info');
      } else {
        setIsGeneratingSynthetic(true);
        addAgentMessage('🛰️ Generating synthetic satellite data...', 'info');
      }
      
      const { data, error } = await supabase.functions.invoke('store-satellite-data', {
        body: {
          game_session_id: state.gameSessionId,
          lat: state.location.lat,
          lon: state.location.lon,
          start_date: state.startDate,
          end_date: state.harvestDate
        }
      });

      if (error) {
        console.error('Satellite data error:', error);
        addAgentMessage(`❌ Error fetching satellite data: ${error.message}`, 'error');
        setIsGeneratingSynthetic(false);
        return;
      }

      if (data?.success) {
        console.log('Satellite data stored:', data);
        setSatelliteDataLoaded(true);
        setShowFallbackButton(false);
        setIsGeneratingSynthetic(false);
        
        // Update initial NDVI from first day of satellite data
        if (data.data && data.data.length > 0) {
          const firstDay = data.data[0];
          setNdvi(firstDay.ndvi);
          setSoilMoisture(firstDay.soil_moisture * 100); // Convert to percentage
          setTemperature(firstDay.lst_celsius || (firstDay.lst_kelvin - 273.15));
          setDataSource(firstDay.data_source);
          
          const sourceLabel = firstDay.data_source === 'MODIS_REAL' ? '🟢 Real NASA Data' : '🟡 Synthetic Data';
          addAgentMessage(
            `✅ ${sourceLabel}: Loaded ${data.records_created} days (NDVI, LST, soil moisture)`, 
            'success'
          );
        }
      }
    } catch (error) {
      console.error('Error fetching satellite data:', error);
      addAgentMessage(`❌ Failed to fetch satellite data: ${error}`, 'error');
      setIsGeneratingSynthetic(false);
    }
  };

  // Wait 30 seconds, then show fallback button if no real data exists
  useEffect(() => {
    if (!state?.gameSessionId || satelliteDataLoaded) return;
    
    const timer = setTimeout(async () => {
      const hasRealData = await checkForRealData();
      if (!hasRealData && !satelliteDataLoaded) {
        setShowFallbackButton(true);
        addAgentMessage('⏱️ No real satellite data uploaded yet. You can generate synthetic data to continue.', 'warning');
      }
    }, 30000); // 30 seconds
    
    return () => clearTimeout(timer);
  }, [state?.gameSessionId, satelliteDataLoaded]);

  // Poll for real data every 10 seconds
  useEffect(() => {
    if (!state?.gameSessionId || satelliteDataLoaded) return;
    
    const pollInterval = setInterval(async () => {
      setDataCheckAttempts(prev => prev + 1);
      const hasRealData = await checkForRealData();
      
      if (hasRealData) {
        addAgentMessage('🎉 Real satellite data detected! Loading...', 'success');
        fetchAndStoreSatelliteData(false);
      }
    }, 10000); // 10 seconds
    
    return () => clearInterval(pollInterval);
  }, [state?.gameSessionId, satelliteDataLoaded]);

  const addAgentMessage = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setAgentMessages(prev => [...prev, { text: message, type, timestamp: Date.now() }]);
  };

  const addActivityLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setActivityLog(prev => [...prev, { message, type, day: currentDay }]);
  };

  const fetchSatelliteData = async () => {
    if (!state?.gameSessionId) return;
    
    try {
      addAgentMessage('🛰️ Fetching stored satellite data...', 'info');
      
      // Calculate which day's data to fetch based on current game day
      const gameStartDate = new Date(state.startDate);
      const currentDataDate = new Date(gameStartDate);
      currentDataDate.setDate(currentDataDate.getDate() + currentDay - 1);
      const targetDate = currentDataDate.toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('satellite_data')
        .select('*')
        .eq('game_session_id', state.gameSessionId)
        .eq('date', targetDate)
        .single();

      if (error) {
        console.error('Satellite data error:', error);
        addAgentMessage(`❌ No data for day ${currentDay}: ${error.message}`, 'error');
        return;
      }

      if (data) {
        console.log(`Satellite data for day ${currentDay}:`, data);
        
        // Update game state with data for current game day
        setNdvi(data.ndvi || ndvi);
        setSoilMoisture((data.soil_moisture || 0) * 100);
        setTemperature(data.lst_celsius || (data.lst_kelvin ? data.lst_kelvin - 273.15 : temperature));
        
        const sourceLabel = data.data_source === 'MODIS_REAL' ? '🟢 Real NASA' : '🟡 Synthetic';
        addAgentMessage(
          `${sourceLabel} Day ${currentDay}: NDVI ${data.ndvi?.toFixed(2)}, Moisture ${((data.soil_moisture || 0) * 100).toFixed(1)}%, Temp ${(data.lst_celsius || 0).toFixed(1)}°C`,
          'success'
        );
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
    <div className="min-h-screen w-full bg-gradient-to-br from-primary via-secondary to-accent flex flex-col pb-[40vh] md:pb-[30vh]">{/* Added padding for chat */}
      {/* Fixed Header */}
      <div className="bg-gradient-to-r from-primary via-green-600 to-accent px-3 py-2 border-b border-white/20">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-primary-foreground truncate">{state.farmName}</h1>
            <p className="text-xs text-primary-foreground/80 truncate">{state.location.name}</p>
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

      {/* Game Session ID Card */}
      {/* Data Source Badge */}
      {dataSource && (
        <div className="bg-card/95 backdrop-blur px-3 py-2 border-b">
          <Card className="border-primary/20">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Data Source:</span>
                <Badge variant={dataSource === 'MODIS_REAL' ? 'default' : 'secondary'} className="text-xs">
                  {dataSource === 'MODIS_REAL' ? '🟢 Real NASA Data' : '🟡 Synthetic Data'}
                </Badge>
              </div>
              {showFallbackButton && !satelliteDataLoaded && (
                <div className="pt-2 border-t border-border/50">
                  <p className="text-xs text-muted-foreground mb-2">
                    No real data detected. Generate synthetic data to continue:
                  </p>
                  <Button 
                    className="w-full" 
                    size="sm"
                    variant="secondary"
                    onClick={() => fetchAndStoreSatelliteData(true)}
                    disabled={isGeneratingSynthetic}
                  >
                    {isGeneratingSynthetic ? 'Generating...' : '⚡ Generate Synthetic Data'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Indicators */}
      <div className="bg-white/95 backdrop-blur px-3 py-3 border-b">
        <div className="grid grid-cols-4 gap-3">
          {/* Budget Card */}
          <div className="bg-white rounded-lg p-3 shadow-md border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-xs text-gray-600">Budget</span>
            </div>
            <p className={`text-xl font-bold ${budget > 5000 ? 'text-green-600' : 'text-red-600'}`}>
              €{budget.toLocaleString()}
            </p>
          </div>

          {/* Water Reserve Card */}
          <div className="bg-white rounded-lg p-3 shadow-md border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Droplet className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-gray-600">Water Reserve</span>
            </div>
            <p className="text-xl font-bold text-blue-600">{waterReserve}%</p>
          </div>

          {/* Env. Score Card */}
          <div className="bg-white rounded-lg p-3 shadow-md border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Leaf className="w-4 h-4 text-green-600" />
              <span className="text-xs text-gray-600">Env. Score</span>
            </div>
            <p className="text-xl font-bold text-green-600">{envScore}</p>
          </div>

          {/* Temperature Card */}
          <div className="bg-white rounded-lg p-3 shadow-md border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Thermometer className="w-4 h-4 text-orange-600" />
              <span className="text-xs text-gray-600">Temperature</span>
            </div>
            <p className="text-xl font-bold text-orange-600">
              {temperature.toFixed(1)}°C
            </p>
          </div>
        </div>
      </div>

      {/* NASA Satellite Data */}
      <div className="bg-white/95 backdrop-blur px-3 py-3 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-800">NASA Satellite Data</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowNasaInfo(!showNasaInfo)}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <Info className="w-4 h-4 mr-1" />
            Show Data Info
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {/* SMAP Soil Moisture */}
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Droplet className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-xs font-semibold text-blue-700">SMAP SOIL MOISTURE</p>
                <p className="text-[10px] text-blue-600">Root zone, 9km res, 3-day lag</p>
              </div>
            </div>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-bold text-gray-800">{soilMoisture.toFixed(0)}%</p>
              <Badge className={`${soilMoisture < 40 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {soilMoisture < 40 ? 'Critical' : 'Good'}
              </Badge>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-1 mt-2">
              <div 
                className="h-1 rounded-full bg-blue-600 transition-all"
                style={{ width: `${soilMoisture}%` }}
              ></div>
            </div>
            {showNasaInfo && (
              <p className="text-[10px] text-blue-600 mt-2">Optimal range: 50-70% for most crops</p>
            )}
          </div>

          {/* MODIS NDVI */}
          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Leaf className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-xs font-semibold text-green-700">MODIS NDVI</p>
                <p className="text-[10px] text-green-600">Vegetation health, 250m res</p>
              </div>
            </div>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-bold text-gray-800">{ndvi.toFixed(2)}</p>
              <Badge className={`${ndvi < 0.5 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                {ndvi < 0.5 ? 'Moderate' : 'Healthy'}
              </Badge>
            </div>
            <div className="w-full bg-green-200 rounded-full h-1 mt-2">
              <div 
                className="h-1 rounded-full bg-green-600 transition-all"
                style={{ width: `${ndvi * 100}%` }}
              ></div>
            </div>
            {showNasaInfo && (
              <p className="text-[10px] text-green-600 mt-2">Range: 0 (bare soil) to 0.85 (dense vegetation)</p>
            )}
          </div>

          {/* GPM Precipitation */}
          <div className="bg-sky-50 rounded-lg p-3 border border-sky-200">
            <div className="flex items-center gap-2 mb-2">
              <Droplet className="w-4 h-4 text-sky-600" />
              <div>
                <p className="text-xs font-semibold text-sky-700">GPM PRECIPITATION</p>
                <p className="text-[10px] text-sky-600">Recent rainfall, 10km res</p>
              </div>
            </div>
            <div className="flex items-end justify-between">
              <p className="text-2xl font-bold text-gray-800">0mm</p>
              <Badge className="bg-gray-100 text-gray-700">No Rain</Badge>
            </div>
            <div className="w-full bg-sky-200 rounded-full h-1 mt-2">
              <div 
                className="h-1 rounded-full bg-sky-600 transition-all"
                style={{ width: '0%' }}
              ></div>
            </div>
            {showNasaInfo && (
              <p className="text-[10px] text-sky-600 mt-2">Last 24 hours, updated every 30 min</p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
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

        {/* Actions Buttons */}
        <div className="mt-4 w-full max-w-sm space-y-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button className="w-full" size="lg">
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

        {/* Real Monitoring Button */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full border-green-500 text-green-700" size="lg">
              <Satellite className="mr-2 w-5 h-5" />
              Real-Time Analysis
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Real-Time Field Monitoring</DialogTitle>
              <DialogDescription>
                Live satellite data analysis for your field
              </DialogDescription>
            </DialogHeader>
            <RealMonitoring 
              initialLat={state.location.lat}
              initialLon={state.location.lon}
              initialCrop={state.crop.name.split(' ')[0].toLowerCase()}
            />
          </DialogContent>
        </Dialog>
        </div>

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

      <FullWidthChat 
        agentMessages={agentMessages}
        mode={state.mode}
        location={state.location}
        onAddMessage={(msg) => setAgentMessages(prev => [...prev, msg])}
        onWaterCrop={() => handleAction('irrigate')}
        onApplyFertilizer={() => handleAction('fertilize')}
        onCheckMarket={() => handleAction('monitor')}
        onViewLogs={() => {
          console.log('Activity logs:', activityLog);
        }}
      />
    </div>
  );
};

export default Game;
