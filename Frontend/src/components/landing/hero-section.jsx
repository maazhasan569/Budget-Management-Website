import { CheckCircle2 } from "lucide-react"
import { ShinyButton } from "./shiny-btn"
import { Button } from "@/components/ui/button"
import { AuroraBackground } from "./aurora-background"

export function HeroSection() {
    return (
        <header className="relative overflow-hidden py-20">
           
                <div className="absolute inset-0 -z-10">
                    <AuroraBackground />
                </div>

        
            <div className="relative z-10 mx-auto max-w-6xl px-6">
                <div className="max-w-2xl">
                    <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
                        One place for every money decision you make.
                    </h1>
                    <p className="mt-5 max-w-[46ch] text-lg text-muted-foreground">
                        Track what you earn and spend, chip away at loans, fund your goals, and keep up with every payment.
                    </p>
                    <div className="mt-7 flex flex-wrap gap-3">
                        <ShinyButton>Get started free</ShinyButton>
                        <Button variant="outline" asChild>
                            <a href="#showcase">See the dashboard</a>
                        </Button>
                    </div>
                    <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-success" /> No card needed to start
                    </p>
                </div>
            </div>
        </header>
    )
}