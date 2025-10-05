import { Button } from "@/components/ui/button";
import { Rocket, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const DemoCTA = () => {
  const navigate = useNavigate();

  return (
    <section id="demo" className="py-24 bg-gradient-to-br from-primary via-secondary to-accent relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-10 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center text-white space-y-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl mb-4">
            <Rocket className="w-10 h-10" />
          </div>

          <h2 className="text-4xl lg:text-6xl font-bold leading-tight">
            Ready to Transform Your Farming?
          </h2>

          <p className="text-xl lg:text-2xl text-white/90 max-w-2xl mx-auto">
            Experience NASA satellite data, AI-powered insights, and precision agriculture at your fingertips.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button
              size="lg"
              onClick={() => navigate('/dashboard')}
              className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6 shadow-elevated group"
            >
              Try Demo Now
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          <p className="text-sm text-white/70 pt-4">
            No credit card required • Free NASA data access • Start in 2 minutes
          </p>
        </div>
      </div>
    </section>
  );
};

export default DemoCTA;
