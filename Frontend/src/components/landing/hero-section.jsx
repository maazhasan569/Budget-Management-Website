import { CheckCircle2 } from "lucide-react"
import { ShinyButton } from "./shiny-btn"
import { Button } from "@/components/ui/button"
import { AuroraBackground } from "./aurora-background"

export function HeroSection() {
    const scrollToSection = (id) => {
        const element = document.getElementById(id)
        if (element) {
            element.scrollIntoView({ behavior: "smooth" })
        }
    }

    return (
        <header className="relative overflow-hidden py-14 sm:py-20">
            {/* <HeroPreviewCards/> */}
            <div className="absolute inset-0 -z-10">
                <AuroraBackground />
            </div>

            <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6">
                <div className="max-w-2xl">
                    <h1 className="font-serif text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl">
                        One place for every money decision you make.
                    </h1>
                    <p className="mt-4 max-w-[46ch] text-base text-muted-foreground sm:mt-5 sm:text-lg">
                        Track what you earn and spend, chip away at loans, fund your goals, and keep up with every payment.
                    </p>
                    <div className="mt-6 flex flex-col gap-3 sm:mt-7 sm:flex-row sm:flex-wrap">
                        <ShinyButton className="w-full sm:w-auto">Get started free</ShinyButton>
                        <Button 
                            variant="outline" 
                            type="button"
                            className="w-full sm:w-auto"
                            onClick={() => scrollToSection("showcase")}
                        >
                            See the dashboard
                        </Button>
                    </div>
                    <p className="mt-5 flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" /> No card needed to start
                    </p>
                </div>
            </div>
        </header>
    )
}