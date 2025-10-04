import { useState, useEffect } from 'react';
import { Play, Database, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TerranautAvatar from '@/components/TerranautAvatar';
import AgentChat from '@/components/AgentChat';
import { AgentMessage } from '@/types/game';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const [hoveredMode, setHoveredMode] = useState<string | null>(null);
  const [showAgent, setShowAgent] = useState(true);
  const [agentMessages, setAgentMessages] = useState<AgentMessage[]>([]);

  // Skip auth requirement - commented out
  // useEffect(() => {
  //   if (!loading && !user) {
  //     navigate('/auth');
  //   }
  // }, [user, loading, navigate]);

  const addAgentMessage = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setAgentMessages(prev => [...prev, { text: message, type, timestamp: Date.now() }]);
  };

  useEffect(() => {
   }, []);

  const handleModeSelect = (mode: 'simulation' | 'monitoring') => {
    navigate('/setup', { state: { mode } });
  };

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-b from-sky-600 via-sky-500 to-green-600 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-b from-sky-600 via-sky-500 to-green-600 flex flex-col overflow-hidden relative">
      {/* Floating clouds */}
      <div className="absolute top-10 left-10 w-24 h-12 bg-white/20 rounded-full blur-sm animate-pulse"></div>
      <div className="absolute top-32 right-20 w-32 h-16 bg-white/15 rounded-full blur-sm animate-pulse delay-100"></div>
      
      {/* Header */}
      <div className="bg-gradient-to-r from-primary via-green-600 to-accent px-4 py-3 text-primary-foreground text-center relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-center">
            <div className="flex-1"></div>
            <div className="flex-1 flex flex-col items-center">
              <h1 className="text-3xl font-bold tracking-tight">Terranaut</h1>
              <p className="text-sm">Farm Smart with NASA Satellite Data 🛰️</p>
            </div>
            <div className="flex-1 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="text-white hover:bg-white/20"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Tabs */}
      <div className="flex-1 overflow-hidden p-4">
        <Tabs defaultValue="home" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 max-w-2xl mx-auto mb-4">
            <TabsTrigger value="home">Home</TabsTrigger>
            <TabsTrigger value="simulator">Game Simulator</TabsTrigger>
            <TabsTrigger value="monitoring">Real Monitoring</TabsTrigger>
          </TabsList>
          
          <TabsContent value="home" className="flex-1 overflow-y-auto mt-0">
            <div className="max-w-4xl mx-auto h-full flex flex-col items-center justify-center gap-6">
              <TerranautAvatar />
              <AgentChat 
                showAgent={showAgent}
                setShowAgent={setShowAgent}
                agentMessages={agentMessages}
                mode={null}
                screen="welcome"
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                <Button
                  onClick={() => handleModeSelect('simulation')}
                  className="h-auto py-6 px-4 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Play size={32} />
                    <span className="text-lg font-bold">Game Simulator</span>
                  </div>
                </Button>
                
                <Button
                  onClick={() => handleModeSelect('monitoring')}
                  className="h-auto py-6 px-4 bg-gradient-to-br from-primary to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Database size={32} />
                    <span className="text-lg font-bold">Real Monitoring</span>
                  </div>
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="simulator" className="flex-1 overflow-y-auto mt-0">
            <div className="max-w-2xl mx-auto h-full flex flex-col items-center justify-center gap-6">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-8 rounded-3xl shadow-2xl">
                <div className="flex justify-center mb-4">
                  <div className="bg-white/20 p-4 rounded-full">
                    <Play size={48} />
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-center mb-3">Game Simulator</h2>
                <p className="text-center text-purple-100 mb-6">Learn farming with historical NASA satellite data</p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2">✓ Practice decision-making without real-world risk</li>
                  <li className="flex items-center gap-2">✓ Learn from historical weather patterns</li>
                  <li className="flex items-center gap-2">✓ Perfect for beginners and education</li>
                  <li className="flex items-center gap-2">✓ Understand crop cycles and seasonal changes</li>
                </ul>
                <Button
                  onClick={() => handleModeSelect('simulation')}
                  className="w-full bg-white text-purple-600 hover:bg-purple-50"
                  size="lg"
                >
                  Start Game Simulator
                </Button>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 via-green-50 to-blue-50 rounded-2xl p-6 border-2 border-blue-200 shadow-lg w-full">
                <h4 className="font-bold text-gray-800 text-center mb-4 flex items-center justify-center gap-2">
                  <span className="text-2xl">🛰️</span>
                  <span>NASA Earth Observation Missions</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl p-4 shadow-md">
                    <h5 className="font-bold text-blue-600 mb-2 text-center">SMAP</h5>
                    <p className="text-xs text-gray-600 text-center">Soil Moisture Active Passive - Monitors soil moisture globally</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-md">
                    <h5 className="font-bold text-green-600 mb-2 text-center">MODIS</h5>
                    <p className="text-xs text-gray-600 text-center">Vegetation health & NDVI measurements</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-md">
                    <h5 className="font-bold text-sky-600 mb-2 text-center">GPM</h5>
                    <p className="text-xs text-gray-600 text-center">Global Precipitation Measurement - Rainfall data</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="monitoring" className="flex-1 overflow-y-auto mt-0">
            <div className="max-w-2xl mx-auto h-full flex flex-col items-center justify-center gap-6">
              <div className="bg-gradient-to-br from-primary to-green-600 text-white p-8 rounded-3xl shadow-2xl">
                <div className="flex justify-center mb-4">
                  <div className="bg-white/20 p-4 rounded-full">
                    <Database size={48} />
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-center mb-3">Real Monitoring</h2>
                <p className="text-center text-green-100 mb-6">Monitor your actual farm with live satellite data</p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2">✓ Live NASA satellite data for your location</li>
                  <li className="flex items-center gap-2">✓ Daily weather forecasts and recommendations</li>
                  <li className="flex items-center gap-2">✓ Track real crops and optimize resources</li>
                  <li className="flex items-center gap-2">✓ Make informed decisions based on real data</li>
                </ul>
                <Button
                  onClick={() => handleModeSelect('monitoring')}
                  className="w-full bg-white text-green-600 hover:bg-green-50"
                  size="lg"
                >
                  Start Real Monitoring
                </Button>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 via-green-50 to-blue-50 rounded-2xl p-6 border-2 border-blue-200 shadow-lg w-full">
                <h4 className="font-bold text-gray-800 text-center mb-4 flex items-center justify-center gap-2">
                  <span className="text-2xl">🛰️</span>
                  <span>NASA Earth Observation Missions</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl p-4 shadow-md">
                    <h5 className="font-bold text-blue-600 mb-2 text-center">SMAP</h5>
                    <p className="text-xs text-gray-600 text-center">Soil Moisture Active Passive - Monitors soil moisture globally</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-md">
                    <h5 className="font-bold text-green-600 mb-2 text-center">MODIS</h5>
                    <p className="text-xs text-gray-600 text-center">Vegetation health & NDVI measurements</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-md">
                    <h5 className="font-bold text-sky-600 mb-2 text-center">GPM</h5>
                    <p className="text-xs text-gray-600 text-center">Global Precipitation Measurement - Rainfall data</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
