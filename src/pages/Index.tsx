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
    if (agentMessages.length === 0) {
      setTimeout(() => {
        addAgentMessage("👋 Hello! I'm Terra, your AI farming advisor powered by NASA satellite data!");
      }, 500);
      setTimeout(() => {
        addAgentMessage("I offer two powerful tools: 1) Game Simulator - Learn farming with historical data, 2) Real Monitoring - Connect your farm and get daily insights with forecasts!");
      }, 2000);
      setTimeout(() => {
        addAgentMessage("Both tools are FREE and use real NASA satellite data (SMAP, MODIS, GPM). You can chat with me anytime for advice and forecasts!");
      }, 4000);
    }
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

      <div className="max-w-6xl w-full h-full flex items-center">
        <div className="bg-card rounded-3xl shadow-2xl overflow-hidden animate-scale-in w-full max-h-[95vh]">
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
              <p className="text-base">Farm Smart with NASA Satellite Data 🛰️</p>
              {user && (
                <p className="text-xs mt-1 opacity-90">
                  Welcome, {user.user_metadata?.display_name || user.email}!
                </p>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column - Character & Messages */}
              <div className="flex flex-col items-center">
                <div className="scale-75">
                  <TerranautAvatar />
                </div>
                <div className="mt-2 space-y-2 w-full">
                  {agentMessages.slice(-2).map((msg, idx) => (
                    <div key={idx} className={`rounded-xl p-3 shadow border ${
                      idx === 0 ? 'bg-gradient-to-r from-blue-50 to-green-50 border-blue-200' :
                      'bg-gradient-to-r from-green-50 to-blue-50 border-green-200'
                    }`}>
                      <p className="text-xs text-gray-800 font-medium text-center">
                        {msg.text.includes("Terra") ? (
                          <>
                            {msg.text.split("Terra")[0]}
                            <span className="font-bold text-primary">Terra</span>
                            {msg.text.split("Terra")[1]}
                          </>
                        ) : (
                          msg.text
                        )}
                      </p>
                    </div>
                  ))}
                </div>

                {/* NASA Data Info */}
                <div className="bg-gradient-to-r from-blue-50 via-green-50 to-blue-50 rounded-xl p-3 border border-blue-200 shadow mt-3 w-full">
                  <h4 className="font-bold text-gray-800 text-center mb-2 text-sm flex items-center justify-center gap-1">
                    <span className="text-lg">🛰️</span>
                    <span>NASA Data</span>
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white rounded-lg p-2 shadow-sm">
                      <h5 className="font-bold text-blue-600 text-xs text-center">SMAP</h5>
                      <p className="text-[10px] text-gray-600 text-center">Soil Moisture</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 shadow-sm">
                      <h5 className="font-bold text-green-600 text-xs text-center">MODIS</h5>
                      <p className="text-[10px] text-gray-600 text-center">Vegetation</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 shadow-sm">
                      <h5 className="font-bold text-sky-600 text-xs text-center">GPM</h5>
                      <p className="text-[10px] text-gray-600 text-center">Rainfall</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Mode Selection */}
              <div className="flex flex-col gap-4">
                <button
                  onMouseEnter={() => setHoveredMode('simulation')}
                  onMouseLeave={() => setHoveredMode(null)}
                  onClick={() => handleModeSelect('simulation')}
                  className="group relative bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white p-5 rounded-2xl shadow-xl transition-all transform hover:scale-105 hover:shadow-2xl overflow-hidden flex-1"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <div className="relative z-10">
                    <div className="flex justify-center mb-2">
                      <div className="bg-white/20 p-2 rounded-full">
                        <Play size={28} className="animate-pulse" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-1">Game Simulator</h3>
                    <p className="text-xs text-purple-100 mb-3">Learn with historical NASA data</p>
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
                  className="group relative bg-gradient-to-br from-primary to-green-600 hover:from-green-600 hover:to-green-700 text-white p-5 rounded-2xl shadow-xl transition-all transform hover:scale-105 hover:shadow-2xl overflow-hidden flex-1"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <div className="relative z-10">
                    <div className="flex justify-center mb-2">
                      <div className="bg-white/20 p-2 rounded-full">
                        <Database size={28} className="animate-pulse" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-1">Real Monitoring</h3>
                    <p className="text-xs text-green-100 mb-3">Monitor your actual farm</p>
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
            </div>
          </div>
        </div>
      </div>
      
      <AgentChat 
        showAgent={showAgent}
        setShowAgent={setShowAgent}
        agentMessages={agentMessages}
        mode={null}
        screen="welcome"
      />
    </div>
  );
};

export default Index;
