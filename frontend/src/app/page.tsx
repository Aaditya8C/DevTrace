import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { WorkflowSection } from "@/components/landing/WorkflowSection";
import { CTASection } from "@/components/landing/CTASection";
import { SITE_META } from "@/constants";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `${SITE_META.name} — ${SITE_META.tagline}`,
  description: SITE_META.description,
};

export default function LandingPage() {
  return (
    <main>
      <HeroSection />
      <FeaturesSection />
      <WorkflowSection />
      <CTASection />
    </main>
  );
}
