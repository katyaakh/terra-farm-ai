import { useState, useEffect } from 'react';
import { Play, Database, LogOut, Satellite } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TerranautAvatar from '@/components/TerranautAvatar';
import AgentChat from '@/components/AgentChat';
import { AgentMessage } from '@/types/game';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import terraAvatar from '@/assets/terra-avatar.mp4';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const [hoveredMode, setHoveredMode] = useState<string | null>(null);
  const [showAgent, setShowAgent] = useState(true);
  const [agentMessages, setAgentMessages] = useState<AgentMessage[]>([]);
  const [displayedText, setDisplayedText] = useState('');
  
  const greetingMessage = "Choose your path below - learn with simulations or monitor your real farm!";

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
    let index = 0;
    const typingInterval = setInterval(() => {
      if (index < greetingMessage.length) {
        setDisplayedText(greetingMessage.slice(0, index + 1));
        index++;
      } else {
        clearInterval(typingInterval);
      }
    }, 30);
    
    return () => clearInterval(typingInterval);
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
    <div className="min-h-screen bg-gradient-to-b from-sky-600 via-sky-500 to-green-600 p-4 flex items-center justify-center overflow-hidden relative">
      {/* Floating clouds */}
      <div className="absolute top-10 left-10 w-24 h-12 bg-white/20 rounded-full blur-sm animate-pulse"></div>
      <div className="absolute top-32 right-20 w-32 h-16 bg-white/15 rounded-full blur-sm animate-pulse delay-100"></div>
      <div className="absolute bottom-20 left-1/4 w-20 h-10 bg-white/10 rounded-full blur-sm animate-pulse delay-200"></div>

      <div className="max-w-4xl w-full">
        <div className="bg-card rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary via-green-600 to-accent p-6 text-primary-foreground text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-2">
                <div className="flex-1"></div>
                <h1 className="text-4xl font-bold tracking-tight flex-1">Terranaut</h1>
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
              <p className="text-lg">Farm Smart with NASA Satellite Data 🛰️</p>
              {user && (
                <p className="text-sm mt-2 opacity-90">
                  Welcome, {user.user_metadata?.display_name || user.email}!
                </p>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Terranaut Character */}
            <div className="flex flex-col items-center mb-8">
              <TerranautAvatar />
              
              {/* Agent Chat - Inline below avatar */}
              <div className="mt-6">
                <AgentChat 
                  showAgent={showAgent}
                  setShowAgent={setShowAgent}
                  agentMessages={agentMessages}
                  mode={null}
                  screen="welcome"
                />
              </div>
            </div>

            {/* Avatar and Greeting */}
            <div className="mb-6 bg-card/50 backdrop-blur rounded-2xl p-6 border border-primary/20">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="w-32 h-32 flex-shrink-0">
                  <video 
                    src={terraAvatar} 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <p className="text-lg text-foreground">
                    {displayedText}
                    <span className="animate-pulse">|</span>
                  </p>
                </div>
              </div>
            </div>

            {/* NASA Data Info */}
            <div className="bg-gradient-to-r from-blue-50 via-green-50 to-blue-50 rounded-2xl p-6 border-2 border-blue-200 shadow-lg mb-6">
              <h4 className="font-bold text-gray-800 text-center mb-4 flex items-center justify-center gap-2">
                <span className="text-2xl">🛰️</span>
                <span>NASA Earth Observation Missions</span>
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow">
                  <h5 className="font-bold text-blue-600 mb-2 text-center">SMAP</h5>
                  <p className="text-xs text-gray-600 text-center">Soil Moisture Active Passive - Monitors soil moisture globally</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow">
                  <h5 className="font-bold text-green-600 mb-2 text-center">MODIS</h5>
                  <p className="text-xs text-gray-600 text-center">Vegetation health & NDVI measurements</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow">
                  <h5 className="font-bold text-sky-600 mb-2 text-center">GPM</h5>
                  <p className="text-xs text-gray-600 text-center">Global Precipitation Measurement - Rainfall data</p>
                </div>
              </div>
            </div>

            {/* Mode Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <button
                onMouseEnter={() => setHoveredMode('simulation')}
                onMouseLeave={() => setHoveredMode(null)}
                onClick={() => handleModeSelect('simulation')}
                className="group relative bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white p-6 rounded-2xl shadow-xl transition-all transform hover:scale-105 hover:shadow-2xl overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <div className="relative z-10">
                  <div className="flex justify-center mb-3">
                    <div className="bg-white/20 p-3 rounded-full">
                      <Play size={32} className="animate-pulse" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Game Simulator</h3>
                  <p className="text-sm text-purple-100 mb-4">Learn with historical NASA data</p>
                  {hoveredMode === 'simulation' && (
                    <div className="animate-fade-in">
                      <ul className="text-xs text-left text-purple-100 space-y-1">
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
                className="group relative bg-gradient-to-br from-primary to-green-600 hover:from-green-600 hover:to-green-700 text-white p-6 rounded-2xl shadow-xl transition-all transform hover:scale-105 hover:shadow-2xl overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <div className="relative z-10">
                  <div className="flex justify-center mb-3">
                    <div className="bg-white/20 p-3 rounded-full">
                      <Database size={32} className="animate-pulse" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Real Monitoring</h3>
                  <p className="text-sm text-green-100 mb-4">Monitor your actual farm</p>
                  {hoveredMode === 'monitoring' && (
                    <div className="animate-fade-in">
                      <ul className="text-xs text-left text-green-100 space-y-1">
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

            {/* Quick Access to Real Monitoring */}
            <div className="mb-6">
              <Button
                onClick={() => navigate('/real-monitoring')}
                variant="outline"
                className="w-full border-2 border-green-500 hover:bg-green-50 text-green-700 font-semibold"
              >
                <Satellite className="mr-2 h-5 w-5" />
                Quick Access: Real-Time Field Analysis
              </Button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
