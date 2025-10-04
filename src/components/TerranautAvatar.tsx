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
  </div>
);

export default TerranautAvatar;
