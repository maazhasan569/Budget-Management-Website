import { Navbar } from "@/components/landing/navbar"
import { HeroSection } from "@/components/landing/hero-section"
import { DashboardShowcase } from "@/components/landing/dashboard-showcase"
import { FeaturesGrid } from "@/components/landing/features-grid"

export function LandingPage() {
  return (
    <div>
      <Navbar />
      <HeroSection />
      <DashboardShowcase />
      <FeaturesGrid />
    </div>
  )
}