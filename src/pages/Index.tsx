import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import BiasTracker from "@/components/BiasTracker";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-14">
        <Hero />
        <Features />
        <HowItWorks />
        <BiasTracker />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
