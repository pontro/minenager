import Image from "next/image";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesComparison from "@/components/FeaturesComparison";
import PricingSection from "@/components/PricingSection";
import DownloadSection from "@/components/DownloadSection";
import Footer from "@/components/Footer";
import Squares from "@/components/ui/react-bits/Squares";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col bg-[#060913] relative overflow-hidden">
      {/* Fixed Full-Page Atmospheric Minecraft Background Image */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <Image
          src="/images/hero-bg.png"
          alt="Atmospheric Minecraft Background"
          fill
          priority
          unoptimized
          className="object-cover object-center opacity-45 scale-105"
        />
        {/* Soft dark gradient vignette across full page */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#060913]/60 via-[#060913]/40 to-[#060913]/90" />
      </div>

      {/* Full-Page Dynamic Animated Squares Grid */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <Squares
          direction="diagonal"
          speed={0.15}
          squareSize={48}
          borderColor="rgba(255, 255, 255, 0.045)"
          hoverFillColor="rgba(6, 182, 212, 0.12)"
        />
      </div>

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
