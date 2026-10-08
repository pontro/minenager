import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesComparison from "@/components/FeaturesComparison";
import PricingSection from "@/components/PricingSection";
import DownloadSection from "@/components/DownloadSection";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col bg-[#060913] relative">
      {/* Foreground Content */}
      <div className="relative z-10 flex flex-col flex-1">
        <Navbar />
        <HeroSection />
        <FeaturesComparison />
        <PricingSection />
        <DownloadSection />
        <Footer />
      </div>
    </main>
  );
}
