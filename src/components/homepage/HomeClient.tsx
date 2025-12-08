import NewHeroSection from "@/components/homepage/NewHeroSection";
import KeyBenefits from "@/components/homepage/KeyBenefits";
import HowItWorks from "@/components/homepage/HowItWorks";
import FeaturesGrid from "@/components/homepage/FeaturesGrid";
import SocialProof from "@/components/homepage/SocialProof";
import PricingAndFAQ from "@/components/homepage/PricingAndFAQ";
import WaitlistSection from "@/components/WaitlistSection";
import FloatingCTA from "@/components/homepage/FloatingCTA";

const HomeClient: React.FC = () => {
  return (
    <>
      <NewHeroSection />
      <KeyBenefits />
      <HowItWorks />
      <FeaturesGrid />
      <SocialProof />
      <PricingAndFAQ />
      <WaitlistSection />
      <FloatingCTA />
    </>
  );
};

export default HomeClient;
