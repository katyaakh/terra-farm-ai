import { useLocation, useNavigate } from 'react-router-dom';
import { Crop, Location } from '@/types/game';
import { Trophy, TrendingUp, Leaf, DollarSign, Star, Home, RotateCcw } from 'lucide-react';

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const state = location.state as {
    farmName: string;
    crop: Crop;
    location: Location;
    finalBudget: number;
    envScore: number;
    quality: number;
    days: number;
  } | null;

  if (!state) {
    navigate('/');
    return null;
  }

  const getQualityGrade = (quality: number) => {
    if (quality >= 90) return { grade: 'Premium', color: 'text-primary', multiplier: state.crop.marketPricing.premiumMultiplier };
    if (quality >= 70) return { grade: 'Good', color: 'text-accent', multiplier: state.crop.marketPricing.goodMultiplier };
    if (quality >= 50) return { grade: 'Average', color: 'text-yellow-600', multiplier: state.crop.marketPricing.averageMultiplier };
    return { grade: 'Poor', color: 'text-destructive', multiplier: state.crop.marketPricing.poorMultiplier };
  };

  const qualityInfo = getQualityGrade(state.quality);
  const baseProfit = state.crop.marketPricing.pricePerHectare;
  const finalProfit = Math.round(baseProfit * qualityInfo.multiplier);
  const totalRevenue = state.finalBudget + finalProfit;
  const netProfit = totalRevenue - 10000; // Initial budget was 10000

  const getOverallRating = () => {
    const score = (state.quality * 0.4) + (state.envScore * 0.3) + ((state.finalBudget / 10000) * 100 * 0.3);
    if (score >= 80) return { stars: 5, title: '🏆 Master Farmer', color: 'text-primary' };
    if (score >= 65) return { stars: 4, title: '🌟 Expert Farmer', color: 'text-accent' };
    if (score >= 50) return { stars: 3, title: '⭐ Good Farmer', color: 'text-yellow-600' };
    if (score >= 35) return { stars: 2, title: '📈 Learning Farmer', color: 'text-orange-600' };
    return { stars: 1, title: '🌱 Beginner Farmer', color: 'text-muted-foreground' };
  };

  const rating = getOverallRating();

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary via-accent to-primary p-4 flex items-center justify-center">
      <div className="max-w-4xl w-full">
        <div className="bg-card rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary via-accent to-primary p-8 text-primary-foreground text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
            <div className="relative z-10">
              <Trophy className="mx-auto mb-4" size={64} />
              <h1 className="text-4xl font-bold mb-2">Harvest Complete!</h1>
              <p className="text-xl">{state.farmName}</p>
              <p className="text-sm opacity-90 mt-2">{state.crop.name} - {state.days} Days</p>
            </div>
          </div>

          {/* Overall Rating */}
          <div className="p-6 bg-gradient-to-b from-secondary/30 to-card">
            <div className="text-center mb-6">
              <h2 className={`text-3xl font-bold mb-3 ${rating.color}`}>{rating.title}</h2>
              <div className="flex justify-center gap-2 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={32}
                    className={i < rating.stars ? 'fill-yellow-500 text-yellow-500' : 'text-muted'}
                  />
                ))}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Crop Quality */}
              <div className="bg-card border-2 border-border rounded-xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Leaf className="text-primary" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Crop Quality</p>
                    <p className={`text-2xl font-bold ${qualityInfo.color}`}>{qualityInfo.grade}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="w-full bg-muted rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-destructive via-yellow-500 to-primary h-3 rounded-full transition-all"
                      style={{ width: `${state.quality}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-center font-semibold">{state.quality}% Quality Score</p>
                  <p className="text-xs text-muted-foreground text-center">
                    Market Multiplier: {qualityInfo.multiplier}x
                  </p>
                </div>
              </div>

              {/* Financial Performance */}
              <div className="bg-card border-2 border-border rounded-xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-accent/10 rounded-full">
                    <DollarSign className="text-accent" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Financial Result</p>
                    <p className={`text-2xl font-bold ${netProfit > 0 ? 'text-primary' : 'text-destructive'}`}>
                      {netProfit > 0 ? '+' : ''}€{netProfit.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Starting Budget:</span>
                    <span className="font-semibold">€10,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Remaining:</span>
                    <span className="font-semibold">€{state.finalBudget.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Harvest Sale:</span>
                    <span className="font-semibold text-primary">€{finalProfit.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between">
                    <span className="font-bold">Total Revenue:</span>
                    <span className="font-bold text-accent">€{totalRevenue.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Environmental Score */}
              <div className="bg-card border-2 border-border rounded-xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Leaf className="text-primary" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Environmental Impact</p>
                    <p className="text-2xl font-bold text-primary">{state.envScore}/100</p>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-primary to-accent h-3 rounded-full transition-all"
                    style={{ width: `${state.envScore}%` }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Sustainable farming practices score
                </p>
              </div>

              {/* Growth Performance */}
              <div className="bg-card border-2 border-border rounded-xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-accent/10 rounded-full">
                    <TrendingUp className="text-accent" size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Crop Growth</p>
                    <p className="text-2xl font-bold text-accent">{state.days} Days</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-semibold">{state.location.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Crop Type:</span>
                    <span className="font-semibold">{state.crop.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Growth Period:</span>
                    <span className="font-semibold">{state.crop.growthDays} days</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Market Pricing Details */}
            <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950 rounded-xl p-6 mb-6 border-2 border-primary/20">
              <h3 className="font-bold text-card-foreground mb-4 text-center">📊 Market Pricing Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Base Price</p>
                  <p className="font-bold text-sm">{state.crop.marketPricing.basePrice} {state.crop.marketPricing.unit}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Your Quality</p>
                  <p className={`font-bold text-sm ${qualityInfo.color}`}>{qualityInfo.grade}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Demand Level</p>
                  <p className="font-bold text-sm">{state.crop.marketPricing.demandLevel}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Final Price</p>
                  <p className="font-bold text-primary text-sm">
                    {(state.crop.marketPricing.basePrice * qualityInfo.multiplier).toFixed(2)} {state.crop.marketPricing.unit}
                  </p>
                </div>
              </div>
            </div>

            {/* NASA Data Summary */}
            <div className="bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950 dark:to-blue-950 rounded-xl p-6 mb-6 border-2 border-accent/20">
              <h3 className="font-bold text-card-foreground mb-3 text-center flex items-center justify-center gap-2">
                <span>🛰️</span> NASA Satellite Data Summary
              </h3>
              <p className="text-sm text-center text-muted-foreground">
                Your farm was monitored using real NASA satellite missions: SMAP for soil moisture, MODIS for vegetation health (NDVI), and GPM for precipitation data.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center justify-center gap-2 bg-secondary hover:opacity-90 text-secondary-foreground py-4 px-6 rounded-xl font-bold text-lg transition-opacity shadow-lg"
              >
                <Home size={24} />
                Back to Home
              </button>
              <button
                onClick={() => navigate('/setup', { state: { mode: 'simulation' } })}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground py-4 px-6 rounded-xl font-bold text-lg transition-opacity shadow-lg"
              >
                <RotateCcw size={24} />
                Play Again
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;
