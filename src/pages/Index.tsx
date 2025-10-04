import { useState, useEffect } from 'react';
import { Play, Database, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TerranautAvatar from '@/components/TerranautAvatar';
import AgentChat from '@/components/AgentChat';
import { AgentMessage } from '@/types/game';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

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

      {/* Main Content - Two Columns */}
      <div className="flex-1 flex items-stretch overflow-hidden p-4 gap-4">
        {/* Left Column - Avatar & Chat */}
        <div className="flex-1 flex flex-col items-center justify-center gap-4 max-w-md">
          <TerranautAvatar />
          <AgentChat 
            showAgent={showAgent}
            setShowAgent={setShowAgent}
            agentMessages={agentMessages}
            mode={null}
            screen="welcome"
          />
        </div>

        {/* Right Column - Mode Selection & NASA Info */}
        <div className="flex-1 flex flex-col gap-4 max-w-2xl">
          {/* Mode Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onMouseEnter={() => setHoveredMode('simulation')}
              onMouseLeave={() => setHoveredMode(null)}
              onClick={() => handleModeSelect('simulation')}
              className="group relative bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white p-4 rounded-2xl shadow-xl transition-all transform hover:scale-105 hover:shadow-2xl overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              <div className="relative z-10">
                <div className="flex justify-center mb-2">
                  <div className="bg-white/20 p-2 rounded-full">
                    <Play size={24} className="animate-pulse" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-1">Game Simulator</h3>
                <p className="text-xs text-purple-100 mb-2">Learn with historical NASA data</p>
                {hoveredMode === 'simulation' && (
                  <div className="animate-fade-in">
                    <ul className="text-xs text-left text-purple-100 space-y-0.5">
                      <li>✓ Practice decision-making</li>
                      <li>✓ No real-world risk</li>
                      <li>✓ Learn from past patterns</li>
                      <li>✓ Perfect for beginners</li>
                    </ul>
                  </div>
                )}
              </div>
            </button>

            <button
              onMouseEnter={() => setHoveredMode('monitoring')}
              onMouseLeave={() => setHoveredMode(null)}
              onClick={() => handleModeSelect('monitoring')}
              className="group relative bg-gradient-to-br from-primary to-green-600 hover:from-green-600 hover:to-green-700 text-white p-4 rounded-2xl shadow-xl transition-all transform hover:scale-105 hover:shadow-2xl overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              <div className="relative z-10">
                <div className="flex justify-center mb-2">
                  <div className="bg-white/20 p-2 rounded-full">
                    <Database size={24} className="animate-pulse" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-1">Real Monitoring</h3>
                <p className="text-xs text-green-100 mb-2">Monitor your actual farm</p>
                {hoveredMode === 'monitoring' && (
                  <div className="animate-fade-in">
                    <ul className="text-xs text-left text-green-100 space-y-0.5">
                      <li>✓ Live satellite data</li>
                      <li>✓ Daily forecasts</li>
                      <li>✓ Track real crops</li>
                      <li>✓ Optimize resources</li>
                    </ul>
                  </div>
                )}
              </div>
            </button>
          </div>

          {/* NASA Data Info */}
          <div className="bg-gradient-to-r from-blue-50 via-green-50 to-blue-50 rounded-2xl p-4 border-2 border-blue-200 shadow-lg">
            <h4 className="font-bold text-gray-800 text-center mb-3 flex items-center justify-center gap-2 text-sm">
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
      </div>
    </div>
  );
};

export default Index;
