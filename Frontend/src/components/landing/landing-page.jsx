import { useLocation } from "react-router-dom"

import { Navbar } from "@/components/landing/navbar"
import { HeroSection } from "@/components/landing/hero-section"
import { DashboardShowcase } from "@/components/landing/dashboard-showcase"
import { FeaturesGrid } from "@/components/landing/features-grid"

export function LandingPage() {
  const location = useLocation()

  return (
    <div>
      {location.state?.logoutError && (
        <p role="alert" className="border-b border-destructive/25 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive">
          {location.state.logoutError} Your local session has been cleared.
        </p>
      )}
      <Navbar />
      <HeroSection />
      <DashboardShowcase />
      <FeaturesGrid />
    </div>
  )
}