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
      <div className="min-h-screen bg-gradient-to-b from-sky-600 via-sky-500 to-green-600 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-b from-sky-600 via-sky-500 to-green-600 p-4 flex items-center justify-center overflow-hidden relative">
      {/* Floating clouds */}
      <div className="absolute top-10 left-10 w-24 h-12 bg-white/20 rounded-full blur-sm animate-pulse"></div>
      <div className="absolute top-32 right-20 w-32 h-16 bg-white/15 rounded-full blur-sm animate-pulse delay-100"></div>
      <div className="absolute bottom-20 left-1/4 w-20 h-10 bg-white/10 rounded-full blur-sm animate-pulse delay-200"></div>

      <div className="max-w-5xl w-full h-[90vh] flex flex-col">
        <div className="bg-card rounded-3xl shadow-2xl overflow-hidden animate-scale-in flex flex-col h-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary via-green-600 to-accent p-4 text-primary-foreground text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-1">
                <div className="flex-1"></div>
                <h1 className="text-3xl font-bold tracking-tight flex-1">Terranaut</h1>
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
              <p className="text-sm">Farm Smart with NASA Satellite Data 🛰️</p>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden p-4">
            <Tabs defaultValue="welcome" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="welcome">Welcome</TabsTrigger>
                <TabsTrigger value="simulator">Game Simulator</TabsTrigger>
                <TabsTrigger value="monitoring">Real Monitoring</TabsTrigger>
              </TabsList>

              <TabsContent value="welcome" className="flex-1 overflow-auto">
                <div className="flex flex-col items-center space-y-4">
                  <TerranautAvatar />
                  
                  <AgentChat 
                    showAgent={showAgent}
                    setShowAgent={setShowAgent}
                    agentMessages={agentMessages}
                    mode={null}
                    screen="welcome"
                  />

                  {/* NASA Data Info */}
                  <div className="bg-gradient-to-r from-blue-50 via-green-50 to-blue-50 rounded-2xl p-4 border-2 border-blue-200 shadow-lg w-full">
                    <h4 className="font-bold text-gray-800 text-center mb-3 flex items-center justify-center gap-2">
                      <span className="text-xl">🛰️</span>
                      <span>NASA Earth Observation Missions</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-white rounded-xl p-3 shadow-md hover:shadow-lg transition-shadow">
                        <h5 className="font-bold text-blue-600 mb-1 text-center text-sm">SMAP</h5>
                        <p className="text-xs text-gray-600 text-center">Soil Moisture Active Passive - Monitors soil moisture globally</p>
                      </div>
                      <div className="bg-white rounded-xl p-3 shadow-md hover:shadow-lg transition-shadow">
                        <h5 className="font-bold text-green-600 mb-1 text-center text-sm">MODIS</h5>
                        <p className="text-xs text-gray-600 text-center">Vegetation health & NDVI measurements</p>
                      </div>
                      <div className="bg-white rounded-xl p-3 shadow-md hover:shadow-lg transition-shadow">
                        <h5 className="font-bold text-sky-600 mb-1 text-center text-sm">GPM</h5>
                        <p className="text-xs text-gray-600 text-center">Global Precipitation Measurement - Rainfall data</p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="simulator" className="flex-1 overflow-auto">
                <div className="h-full flex flex-col justify-center items-center p-4">
                  <div className="group relative bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white p-8 rounded-2xl shadow-xl transition-all transform hover:scale-105 hover:shadow-2xl overflow-hidden max-w-md w-full cursor-pointer"
                       onClick={() => handleModeSelect('simulation')}>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    <div className="relative z-10">
                      <div className="flex justify-center mb-4">
                        <div className="bg-white/20 p-4 rounded-full">
                          <Play size={48} className="animate-pulse" />
                        </div>
                      </div>
                      <h3 className="text-3xl font-bold mb-3 text-center">Game Simulator</h3>
                      <p className="text-purple-100 mb-6 text-center">Learn with historical NASA data</p>
                      <ul className="text-sm text-left text-purple-100 space-y-2">
                        <li>✓ Practice decision-making</li>
                        <li>✓ No real-world risk</li>
                        <li>✓ Learn from past patterns</li>
                        <li>✓ Perfect for beginners</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="monitoring" className="flex-1 overflow-auto">
                <div className="h-full flex flex-col justify-center items-center p-4">
                  <div className="group relative bg-gradient-to-br from-primary to-green-600 hover:from-green-600 hover:to-green-700 text-white p-8 rounded-2xl shadow-xl transition-all transform hover:scale-105 hover:shadow-2xl overflow-hidden max-w-md w-full cursor-pointer"
                       onClick={() => handleModeSelect('monitoring')}>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    <div className="relative z-10">
                      <div className="flex justify-center mb-4">
                        <div className="bg-white/20 p-4 rounded-full">
                          <Database size={48} className="animate-pulse" />
                        </div>
                      </div>
                      <h3 className="text-3xl font-bold mb-3 text-center">Real Monitoring</h3>
                      <p className="text-green-100 mb-6 text-center">Monitor your actual farm</p>
                      <ul className="text-sm text-left text-green-100 space-y-2">
                        <li>✓ Live satellite data</li>
                        <li>✓ Daily forecasts</li>
                        <li>✓ Track real crops</li>
                        <li>✓ Optimize resources</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
