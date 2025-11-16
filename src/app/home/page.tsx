import Navbar from "../../components/navbar/Navbar";
import HeroSection from "../../components/herosection/HeroSection";
import HowItWorksSection from "@/components/howitworkssection/HowItWorksSection";
import FeaturesSection from "@/components/featuresection/FeatureSection";
import MedicalTeamSection from "@/components/medicalteam/MedicalTeamSection";
import DownloadCTASection from "@/components/download-section/DownloadCTASection";

const Home = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <HeroSection />
      <HowItWorksSection />
      <FeaturesSection />
      <MedicalTeamSection />
      <DownloadCTASection />
    </div>
  );
};

export default Home;