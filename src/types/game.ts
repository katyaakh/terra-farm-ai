export interface Location {
  lat: number;
  lon: number;
  name: string;
  climate: string;
}

export interface Crop {
  id: string;
  name: string;
  waterNeed: string;
  droughtTolerance: string;
  profit: number;
  growthDays: number;
  optimalTemp: [number, number];
  marketPricing: {
    basePrice: number;
    unit: string;
    premiumMultiplier: number;
    goodMultiplier: number;
    averageMultiplier: number;
    poorMultiplier: number;
    demandLevel: 'High' | 'Medium' | 'Low';
    pricePerHectare: number;
  };
}

export interface GameLog {
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  day: number;
}

export interface AgentMessage {
  text: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
}

export type PlantHealth = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
