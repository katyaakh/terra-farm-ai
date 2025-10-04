import { useState } from 'react';
import { Play, Database, Sparkles } from 'lucide-react';

const Index = () => {
  const [hoveredMode, setHoveredMode] = useState<string | null>(null);

  const TerranautAvatar = () => (
    <div className="relative w-32 h-40 mx-auto animate-fade-in">
      {/* Helmet */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-20 bg-gradient-to-br from-blue-300 via-blue-400 to-blue-500 rounded-full border-4 border-blue-600 shadow-2xl">
        {/* Visor reflection */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-14 h-10 bg-gradient-to-b from-blue-50 to-blue-100 rounded-full opacity-80 border-2 border-blue-500"></div>
        
        {/* Eyes visible through visor */}
        <div className="absolute top-7 left-3 w-4 h-5 bg-white rounded-full shadow-inner">
          <div className="absolute top-1 left-1 w-3 h-3.5 bg-blue-900 rounded-full">
            <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
          </div>
        </div>
        <div className="absolute top-7 right-3 w-4 h-5 bg-white rounded-full shadow-inner">
          <div className="absolute top-1 left-1 w-3 h-3.5 bg-blue-900 rounded-full">
            <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
          </div>
        </div>
        
        {/* Happy smile */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-8 h-4 border-b-3 border-gray-700 rounded-full"></div>
        
        {/* Antenna with blinking light */}
        <div className="absolute -top-1 right-4 w-1.5 h-4 bg-blue-700 rounded-t-full">
          <div className="absolute -top-1.5 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-green-400 rounded-full shadow-lg shadow-green-400/50 animate-pulse"></div>
        </div>
      </div>

      {/* Body/Suit */}
      <div className="absolute top-16 left-1/2 transform -translate-x-1/2 w-16 h-20 bg-gradient-to-br from-green-400 via-green-500 to-green-600 rounded-2xl border-4 border-green-700 shadow-2xl">
        {/* NASA-style patch */}
        <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-white rounded-full border-2 border-green-800 flex items-center justify-center shadow-lg">
          <span className="text-lg">🌍</span>
        </div>
        
        {/* Belt */}
        <div className="absolute bottom-5 left-0 right-0 h-1.5 bg-blue-700 shadow-md"></div>
        
        {/* Left arm */}
        <div className="absolute top-4 -left-4 w-4 h-10 bg-gradient-to-br from-green-400 to-green-500 rounded-lg border-2 border-green-700 transform rotate-12 shadow-lg">
          <div className="absolute -bottom-1 left-0 w-4 h-4 bg-green-300 rounded-full border-2 border-green-700"></div>
        </div>
        
        {/* Right arm with thumbs up */}
        <div className="absolute top-4 -right-4 w-4 h-10 bg-gradient-to-br from-green-400 to-green-500 rounded-lg border-2 border-green-700 transform -rotate-12 shadow-lg">
          <div className="absolute -bottom-1 right-0 w-4 h-4 bg-green-300 rounded-full border-2 border-green-700 flex items-center justify-center">
            <span className="text-xs">👍</span>
          </div>
        </div>
      </div>

      {/* Legs */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex gap-1">
        <div className="w-6 h-8 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg border-2 border-blue-600 relative shadow-lg">
          <div className="absolute -bottom-1 -left-1 w-7 h-3 bg-blue-700 rounded-md shadow-md"></div>
        </div>
        <div className="w-6 h-8 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg border-2 border-blue-600 relative shadow-lg">
          <div className="absolute -bottom-1 -left-1 w-7 h-3 bg-blue-700 rounded-md shadow-md"></div>
        </div>
      </div>

      {/* Floating sparkles around character */}
      <div className="absolute -top-2 -right-2 animate-pulse">
        <Sparkles size={16} className="text-yellow-400" />
      </div>
      <div className="absolute -bottom-2 -left-2 animate-pulse delay-75">
        <Sparkles size={12} className="text-green-400" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-600 via-sky-500 to-green-600 p-4 flex items-center justify-center overflow-hidden relative">
      {/* Floating clouds */}
      <div className="absolute top-10 left-10 w-24 h-12 bg-white/20 rounded-full blur-sm animate-pulse"></div>
      <div className="absolute top-32 right-20 w-32 h-16 bg-white/15 rounded-full blur-sm animate-pulse delay-100"></div>
      <div className="absolute bottom-20 left-1/4 w-20 h-10 bg-white/10 rounded-full blur-sm animate-pulse delay-200"></div>

      <div className="max-w-4xl w-full">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary via-green-600 to-accent p-6 text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
            <div className="relative z-10">
              <h1 className="text-4xl font-bold mb-2 tracking-tight">TerraSense</h1>
              <p className="text-lg text-green-50">Farm Smart with NASA Satellite Data 🛰️</p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Terranaut Character */}
            <div className="flex flex-col items-center mb-8">
              <TerranautAvatar />
              <div className="mt-6 max-w-2xl space-y-3">
                <div className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200 rounded-2xl p-4 shadow-lg animate-fade-in">
                  <p className="text-sm text-gray-800 font-medium text-center">
                    👋 Hello! I'm <span className="font-bold text-primary">Terra</span>, your AI farming advisor powered by NASA satellite data!
                  </p>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-2xl p-4 shadow-lg animate-fade-in delay-100">
                  <p className="text-sm text-gray-800 text-center">
                    I offer two powerful tools: <span className="font-bold text-accent">Game Simulator</span> to learn farming with historical data, and <span className="font-bold text-primary">Real Monitoring</span> to connect your farm for daily insights with forecasts!
                  </p>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200 rounded-2xl p-4 shadow-lg animate-fade-in delay-200">
                  <p className="text-sm text-gray-800 text-center">
                    Both tools are <span className="font-bold text-green-600">FREE</span> and use real NASA satellite data (SMAP, MODIS, GPM). Chat with me anytime for advice and forecasts! 🌾
                  </p>
                </div>
              </div>
            </div>

            {/* Mode Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <button
                onMouseEnter={() => setHoveredMode('simulation')}
                onMouseLeave={() => setHoveredMode(null)}
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

            {/* NASA Data Info */}
            <div className="bg-gradient-to-r from-blue-50 via-green-50 to-blue-50 rounded-2xl p-6 border-2 border-blue-200 shadow-lg">
              <h4 className="font-bold text-gray-800 text-center mb-4 flex items-center justify-center gap-2">
                <span className="text-2xl">🛰️</span>
                <span>NASA Earth Observation Missions</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
