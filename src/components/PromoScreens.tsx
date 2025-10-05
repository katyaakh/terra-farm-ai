import { Sparkles, Settings, Gamepad2 } from "lucide-react";
import { Card } from "@/components/ui/card";

const screens = [
  {
    icon: Sparkles,
    title: "Welcome",
    gradient: "from-primary via-accent to-primary/80",
    features: [
      "Terra AI avatar with animated welcome",
      "Choose: Game Simulator or Data Collection",
      "FREE NASA satellite data access",
      "Chat with Terra for advice & forecasts",
    ],
    screenshot: null, // Placeholder for future screenshot
  },
  {
    icon: Settings,
    title: "Setup",
    gradient: "from-secondary via-secondary/90 to-secondary/70",
    features: [
      "Farm name & size configuration",
      "Location selection (5 Spanish regions)",
      "Crop selection (Tomatoes, Almonds, Wheat, Olives)",
      "Expected harvest date",
      "Optional sensor connection (pH, Nitrogen, Moisture)",
    ],
    screenshot: null, // Placeholder for future screenshot
  },
  {
    icon: Gamepad2,
    title: "Playing/Monitoring",
    gradient: "from-accent via-primary to-accent/80",
    features: [
      "Real-time NASA satellite data indicators",
      "Budget, Water Reserve, Environmental Score",
      "Dynamic plant visualization by health",
      "Activity log & insights panel",
      "Farm management actions (Irrigate, Fertilize)",
      "Manual data entry with photo uploads",
    ],
    screenshot: null, // Placeholder for future screenshot
  },
];

const PromoScreens = () => {
  return (
    <section id="experience" className="py-24 bg-gradient-to-b from-background to-background/50 relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Experience Terranaut
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Three powerful modes to transform your farming journey with AI-powered insights
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {screens.map((screen, index) => {
            const Icon = screen.icon;
            return (
              <Card
                key={index}
                className={`relative overflow-hidden bg-gradient-to-br ${screen.gradient} border-0 p-8 text-white group hover:scale-105 transition-transform duration-300 animate-scale-in`}
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                {/* Quote icon */}
                <div className="mb-6">
                  <Icon className="w-12 h-12 opacity-90" strokeWidth={1.5} />
                </div>

                {/* Title */}
                <h3 className="text-3xl font-bold mb-6 opacity-90">
                  {screen.title}
                </h3>

                {/* Features list */}
                <ul className="space-y-3 mb-6">
                  {screen.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-white/90">
                      <span className="text-lg mt-1">✓</span>
                      <span className="text-sm leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Placeholder for screenshot */}
                {screen.screenshot && (
                  <div className="mt-6 rounded-lg overflow-hidden shadow-2xl">
                    <img 
                      src={screen.screenshot} 
                      alt={`${screen.title} screen`}
                      className="w-full h-auto"
                    />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PromoScreens;
