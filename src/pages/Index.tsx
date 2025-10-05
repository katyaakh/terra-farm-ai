import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import PromoScreens from "@/components/PromoScreens";
import DemoCTA from "@/components/DemoCTA";

const Index = () => {
  return (
    <main className="min-h-screen">
      <Navigation />
      <div className="pt-16">
        <Hero />
        <Features />
        <PromoScreens />
        <DemoCTA />
      </div>
    </main>
  );
};

export default Index;
