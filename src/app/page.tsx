import Image from "next/image";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesComparison from "@/components/FeaturesComparison";
import PricingSection from "@/components/PricingSection";
import DownloadSection from "@/components/DownloadSection";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col bg-[#060913] relative overflow-hidden">
      {/* Background Image Layer */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Image
          src="/images/hero-bg.png"
          alt="Atmospheric Minecraft Underwater Background"
          fill
          priority
          unoptimized
          className="object-cover object-top"
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
