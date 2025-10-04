import { Location, Crop } from '@/types/game';

export const locations: Location[] = [
  { lat: 41.5, lon: 1.5, name: "Catalonia, Spain", climate: "Mediterranean, hot summers" },
  { lat: 41.68, lon: 2.28, name: "La Garriga, Catalonia", climate: "Mediterranean, ideal for tomatoes" },
  { lat: 37.9, lon: -4.4, name: "Andalusia, Spain", climate: "Mediterranean, very hot & dry" },
  { lat: 43.3, lon: -1.9, name: "Basque Country, Spain", climate: "Oceanic, moderate rainfall" },
  { lat: 39.5, lon: -0.4, name: "Valencia, Spain", climate: "Mediterranean, coastal" }
];

export const crops: Crop[] = [
  { id: 'tomatoes', name: 'Tomatoes (La Garriga)', waterNeed: 'Medium-High', droughtTolerance: 'Medium', profit: 4000, growthDays: 50, optimalTemp: [20, 30] },
  { id: 'almonds', name: 'Almonds', waterNeed: 'Low', droughtTolerance: 'High', profit: 3500, growthDays: 60, optimalTemp: [25, 35] },
  { id: 'wheat', name: 'Wheat', waterNeed: 'Medium', droughtTolerance: 'Medium', profit: 2000, growthDays: 45, optimalTemp: [20, 30] },
  { id: 'olives', name: 'Olives', waterNeed: 'Very Low', droughtTolerance: 'Very High', profit: 3000, growthDays: 70, optimalTemp: [25, 38] }
];
