"use client";

import React from "react";
import HeroSection from "./HeroSection";
import ProcessFlow from "./ProcessFlow";
import AIAgentsExplanation from "./AIAgentsExplanation";
import SuccessStories from "../SuccessStories";
import FAQSection from "./FAQSection";
import CTASection from "./CTASection";

const HowItWorksClient: React.FC = () => {
  return (
    <>
      <HeroSection />
      <ProcessFlow />
      <AIAgentsExplanation />
      <SuccessStories />
      <FAQSection />
      <CTASection />
    </>
  );
};

export default HowItWorksClient;
