import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import RealMonitoring from '@/components/RealMonitoring';

const RealMonitoringPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Real-Time Field Monitoring
            </h1>
            <p className="text-gray-600 mt-2">
              Live satellite data analysis powered by NASA and Terra AI
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>

        {/* Real Monitoring Component */}
        <RealMonitoring />
      </div>
    </div>
  );
};

export default RealMonitoringPage;
