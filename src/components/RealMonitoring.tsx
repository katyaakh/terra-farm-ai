import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Satellite, TrendingUp, Droplet, Thermometer } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
interface ComparisonData {
  soil_moisture: {
    real: string;
    optimal: string;
    status: string;
  };
  temperature: {
    real: string;
    optimal: string;
    status: string;
  };
  ndvi: {
    real: string;
    optimal: string;
    status: string;
  };
}
interface AnalysisResult {
  comparison: ComparisonData;
  geometry: any;
  terra_ai_recommendation: string;
  data_quality: {
    has_interpolated_data: boolean;
    oldest_data_age_days: number;
    data_sources: {
      ndvi: string;
      lst: string;
      smap: string;
    };
  };
}
interface RealMonitoringProps {
  initialLat?: number;
  initialLon?: number;
  initialCrop?: string;
}
const RealMonitoring = ({
  initialLat,
  initialLon,
  initialCrop
}: RealMonitoringProps) => {
  const [lat, setLat] = useState(initialLat?.toString() || '41.68');
  const [lon, setLon] = useState(initialLon?.toString() || '2.28');
  const [area, setArea] = useState('10000'); // 10000 m² = 1 hectare
  const [crop, setCrop] = useState(initialCrop || 'tomatoes');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const {
    toast
  } = useToast();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const fieldLayer = useRef<L.Polygon | null>(null);
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize Leaflet map
    map.current = L.map(mapContainer.current).setView([parseFloat(lat), parseFloat(lon)], 14);

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map.current);
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);
  useEffect(() => {
    if (map.current && lat && lon) {
      map.current.setView([parseFloat(lat), parseFloat(lon)], 14);
    }
  }, [lat, lon]);
  useEffect(() => {
    if (map.current && analysisResult?.geometry) {
      // Remove existing field layer
      if (fieldLayer.current) {
        map.current.removeLayer(fieldLayer.current);
        fieldLayer.current = null;
      }

      // Convert coordinates for Leaflet (lat, lon instead of lon, lat)
      const coordinates = analysisResult.geometry.coordinates[0];
      const leafletCoords: [number, number][] = coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);

      // Add field boundary polygon
      fieldLayer.current = L.polygon(leafletCoords, {
        color: '#00ff00',
        weight: 3,
        fillColor: '#00ff00',
        fillOpacity: 0.1
      }).addTo(map.current);

      // Fit map to polygon bounds
      map.current.fitBounds(fieldLayer.current.getBounds(), {
        padding: [50, 50]
      });
    }
  }, [analysisResult]);
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('analyze-field-conditions', {
        body: {
          lat: parseFloat(lat),
          lon: parseFloat(lon),
          area_m2: parseFloat(area),
          crop
        }
      });
      if (error) {
        throw error;
      }
      setAnalysisResult(data);
      toast({
        title: '✅ Analysis Complete',
        description: 'Field conditions analyzed successfully'
      });
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast({
        title: '❌ Analysis Failed',
        description: error.message || 'Failed to analyze field conditions',
        variant: 'destructive'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'green':
        return '🟢';
      case 'yellow':
        return '🟡';
      case 'red':
        return '🔴';
      default:
        return '⚪';
    }
  };
  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" => {
    switch (status) {
      case 'green':
        return 'default';
      case 'yellow':
        return 'secondary';
      case 'red':
        return 'destructive';
      default:
        return 'secondary';
    }
  };
  const getRecommendationIcon = () => {
    if (!analysisResult) return '📊';
    const allGreen = Object.values(analysisResult.comparison).every(v => v.status === 'green');
    const anyRed = Object.values(analysisResult.comparison).some(v => v.status === 'red');
    if (allGreen) return '✅';
    if (anyRed) return '🚨';
    return '⚠️';
  };
  return <div className="space-y-6">
      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Satellite className="h-5 w-5" />
            Field Parameters
          </CardTitle>
          <CardDescription>
            Enter your field coordinates and details for real-time analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lat">Latitude</Label>
              <Input id="lat" type="number" step="0.0001" value={lat} onChange={e => setLat(e.target.value)} placeholder="41.68" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lon">Longitude</Label>
              <Input id="lon" type="number" step="0.0001" value={lon} onChange={e => setLon(e.target.value)} placeholder="2.28" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="area">Field Area (m²)</Label>
              <Input id="area" type="number" value={area} onChange={e => setArea(e.target.value)} placeholder="10000" />
              <p className="text-xs text-muted-foreground">
                {(parseFloat(area) / 10000).toFixed(2)} hectares
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="crop">Crop Type</Label>
              <Select value={crop} onValueChange={setCrop}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tomatoes">Tomatoes</SelectItem>
                  <SelectItem value="wheat">Wheat</SelectItem>
                  <SelectItem value="corn">Corn</SelectItem>
                  <SelectItem value="almonds">Almonds</SelectItem>
                  <SelectItem value="olives">Olives</SelectItem>
                  <SelectItem value="grapes">Grapes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full">
            {isAnalyzing ? <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Field...
              </> : <>
                <Satellite className="mr-2 h-4 w-4" />
                Analyze Field
              </>}
          </Button>
        </CardContent>
      </Card>

      {/* Results Section */}
      {analysisResult && <>
          {/* Map and Comparison Table */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Map */}
            <Card>
              
              
            </Card>

            {/* Comparison Table */}
            <Card>
              <CardHeader>
                <CardTitle>I ca</CardTitle>
                <CardDescription>Real vs. Optimal comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Parameter</TableHead>
                      <TableHead>Real Value</TableHead>
                      <TableHead>Optimal Range</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Droplet className="h-4 w-4 text-blue-500" />
                          Soil Moisture
                        </div>
                      </TableCell>
                      <TableCell>{analysisResult.comparison.soil_moisture.real}%</TableCell>
                      <TableCell>{analysisResult.comparison.soil_moisture.optimal}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(analysisResult.comparison.soil_moisture.status)}>
                          {getStatusIcon(analysisResult.comparison.soil_moisture.status)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Thermometer className="h-4 w-4 text-orange-500" />
                          Temperature
                        </div>
                      </TableCell>
                      <TableCell>{analysisResult.comparison.temperature.real}°C</TableCell>
                      <TableCell>{analysisResult.comparison.temperature.optimal}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(analysisResult.comparison.temperature.status)}>
                          {getStatusIcon(analysisResult.comparison.temperature.status)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          NDVI
                        </div>
                      </TableCell>
                      <TableCell>{analysisResult.comparison.ndvi.real}</TableCell>
                      <TableCell>{analysisResult.comparison.ndvi.optimal}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(analysisResult.comparison.ndvi.status)}>
                          {getStatusIcon(analysisResult.comparison.ndvi.status)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                {/* Data Quality Info */}
                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Data Source:</span>
                    <Badge variant="outline">
                      {analysisResult.data_quality.data_sources.ndvi}
                    </Badge>
                  </div>
                  {analysisResult.data_quality.has_interpolated_data && <p className="text-yellow-600">
                      ⚠️ Some data points were interpolated
                    </p>}
                  {analysisResult.data_quality.oldest_data_age_days > 3 && <p className="text-yellow-600">
                      ⚠️ Data is {analysisResult.data_quality.oldest_data_age_days} days old
                    </p>}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Terra AI Recommendation */}
          <Card className="border-primary/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getRecommendationIcon()} Terra AI Recommendation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg leading-relaxed">
                {analysisResult.terra_ai_recommendation}
              </p>
            </CardContent>
          </Card>
        </>}
    </div>;
};
export default RealMonitoring;