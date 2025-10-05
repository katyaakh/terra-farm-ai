import { MessageSquare } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-cosmic">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-primary via-secondary to-accent">
        <div className="absolute top-20 left-10 w-64 h-64 bg-accent/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Video and Message Section */}
          <div className="relative animate-scale-in">
            <div className="relative rounded-2xl overflow-hidden shadow-elevated">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-auto"
              >
                <source src="/terra-avatar.mp4" type="video/mp4" />
              </video>
              
              {/* Message Bubbles */}
              <div className="absolute top-8 right-8 max-w-xs">
                <div className="bg-card/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg animate-fade-in border border-border">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
                    <p className="text-sm text-card-foreground">
                      Welcome to Terranaut! I'm Terra, your AI guide to sustainable farming with NASA satellite data.
                    </p>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-8 right-8 max-w-xs">
                <div className="bg-secondary/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg animate-fade-in border border-secondary" style={{ animationDelay: "0.3s" }}>
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-secondary-foreground mt-1 flex-shrink-0" />
                    <p className="text-sm text-secondary-foreground font-medium">
                      Let's optimize your harvest together! 🌱
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="text-white space-y-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
              Terranaut
            </h1>
            <p className="text-2xl lg:text-3xl text-white/90 font-light">
              Smart Farming with NASA Satellite Data
            </p>
            <p className="text-lg text-white/80 max-w-xl">
              Empowering precision irrigation, reducing water waste, and optimizing crop yields through advanced satellite technology and AI-powered insights.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
