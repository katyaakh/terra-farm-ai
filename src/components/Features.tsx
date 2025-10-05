import { Brain, Droplets, Leaf, LineChart, Sparkles, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";

const features = [
  {
    icon: Brain,
    title: "Friendly Terra AI Education",
    description: "Learn sustainable farming practices through interactive AI guidance and real-world applications of NASA satellite data.",
    gradient: "from-accent to-primary",
  },
  {
    icon: Droplets,
    title: "Real-Time Monitoring",
    description: "Track soil moisture, crop health, rainfall, and temperature with precision satellite data updated continuously.",
    gradient: "from-secondary to-accent",
  },
  {
    icon: Leaf,
    title: "Smart Advisories",
    description: "Receive intelligent recommendations on irrigation, fertilization, and environmental factors tailored to your crops.",
    gradient: "from-primary to-secondary",
  },
  {
    icon: LineChart,
    title: "Interactive Visualization",
    description: "Watch your plants come to life with dynamic visualizations that respond to health metrics and growth patterns.",
    gradient: "from-secondary to-primary",
  },
  {
    icon: Sparkles,
    title: "Data Gap Solutions",
    description: "Bridge critical agricultural data gaps through advanced synthetic modeling and NASA satellite integration.",
    gradient: "from-accent to-secondary",
  },
  {
    icon: Trophy,
    title: "Harvest Quality Rewards",
    description: "Earn game rewards based on your harvest quality scores, making sustainable farming both profitable and fun.",
    gradient: "from-primary to-accent",
  },
];

const Features = () => {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Powerful Benefits
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transform your farming with cutting-edge technology that bridges NASA satellite data with practical agricultural insights
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="p-6 bg-card hover:shadow-elevated transition-all duration-300 border-border group animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-card-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
