import { Crop, PlantHealth } from '@/types/game';
import leafIcon from '@/assets/leaf-icon.svg';

interface PlantVisualizationProps {
  health: PlantHealth;
  day: number;
  selectedCrop: Crop | null;
}

const PlantVisualization = ({ health, day, selectedCrop }: PlantVisualizationProps) => {
  const growthStage = Math.min(4, Math.floor((day / (selectedCrop?.growthDays || 50)) * 4));
  
  const healthColors = {
    excellent: { primary: '#22c55e', secondary: '#16a34a', leaves: '#86efac' },
    good: { primary: '#65a30d', secondary: '#4d7c0f', leaves: '#bef264' },
    fair: { primary: '#ca8a04', secondary: '#a16207', leaves: '#fde047' },
    poor: { primary: '#ea580c', secondary: '#c2410c', leaves: '#fdba74' },
    critical: { primary: '#dc2626', secondary: '#991b1b', leaves: '#fca5a5' }
  };
  
  const colors = healthColors[health];
  
  return (
    <div className="relative w-40 h-48 mx-auto">
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-amber-900 to-amber-700 rounded-b-lg"></div>
      
      {growthStage >= 1 && (
        <>
          <div 
            className="absolute bottom-12 left-1/2 transform -translate-x-1/2 rounded-t-lg transition-all duration-500"
            style={{ width: '8px', height: `${25 + growthStage * 18}px`, backgroundColor: colors.secondary }}
          />
          
          {growthStage >= 2 && (
            <div className="absolute" style={{ bottom: `${35 + growthStage * 12}px`, left: '50%', transform: 'translateX(-50%)' }}>
              <img src={leafIcon} alt="leaf" className="absolute w-10 h-10 transform -translate-x-10 -translate-y-1 transition-all duration-500" style={{ filter: `hue-rotate(${health === 'excellent' ? '0deg' : health === 'good' ? '20deg' : health === 'fair' ? '40deg' : health === 'poor' ? '60deg' : '80deg'})`, opacity: 0.9 }} />
              <img src={leafIcon} alt="leaf" className="absolute w-8 h-8 transform -translate-x-12 translate-y-3 transition-all duration-500 -rotate-45" style={{ filter: `hue-rotate(${health === 'excellent' ? '0deg' : health === 'good' ? '20deg' : health === 'fair' ? '40deg' : health === 'poor' ? '60deg' : '80deg'})`, opacity: 0.85 }} />
              <img src={leafIcon} alt="leaf" className="absolute w-10 h-10 transform translate-x-5 -translate-y-1 transition-all duration-500 rotate-12" style={{ filter: `hue-rotate(${health === 'excellent' ? '0deg' : health === 'good' ? '20deg' : health === 'fair' ? '40deg' : health === 'poor' ? '60deg' : '80deg'})`, opacity: 0.9 }} />
              <img src={leafIcon} alt="leaf" className="absolute w-8 h-8 transform translate-x-6 translate-y-3 transition-all duration-500 rotate-45" style={{ filter: `hue-rotate(${health === 'excellent' ? '0deg' : health === 'good' ? '20deg' : health === 'fair' ? '40deg' : health === 'poor' ? '60deg' : '80deg'})`, opacity: 0.85 }} />
            </div>
          )}
          
          {growthStage >= 3 && selectedCrop?.id === 'tomatoes' && (
            <div className="absolute" style={{ bottom: `${40 + growthStage * 12}px`, left: '50%', transform: 'translateX(-50%)' }}>
              {[...Array(Math.min(growthStage, 3))].map((_, i) => (
                <div key={i} className="absolute w-4 h-4 rounded-full shadow-md transition-all duration-500"
                  style={{ backgroundColor: health === 'excellent' || health === 'good' ? '#ef4444' : '#dc2626', left: `${-12 + i * 10}px`, top: `${i * 5}px`, opacity: health === 'critical' ? 0.5 : 1 }}
                />
              ))}
            </div>
          )}
        </>
      )}
      
      {growthStage === 0 && (
        <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2">
          <div className="w-1.5 h-5" style={{ backgroundColor: colors.secondary }} />
          <div className="w-6 h-6 -mt-1 rounded-full bg-gradient-to-br from-green-400 to-green-600" style={{ opacity: health === 'excellent' ? 1 : health === 'good' ? 0.9 : health === 'fair' ? 0.7 : health === 'poor' ? 0.5 : 0.3 }} />
        </div>
      )}
      
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 text-center">
        <div className={`px-2 py-0.5 rounded-full text-xs font-bold ${
          health === 'excellent' ? 'bg-green-100 text-green-800' :
          health === 'good' ? 'bg-lime-100 text-lime-800' :
          health === 'fair' ? 'bg-yellow-100 text-yellow-800' :
          health === 'poor' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'
        }`}>
          {health.toUpperCase()}
        </div>
      </div>
      
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-4 text-center">
        <p className="text-xs text-gray-600 font-semibold">Day {day}/{selectedCrop?.growthDays || 50}</p>
      </div>
    </div>
  );
};

export default PlantVisualization;
