// // src/components/landing/navbar.jsx

// import { Link } from "react-router-dom"
// import { Wallet } from "lucide-react"
// import { Button } from "@/components/ui/button"
// import { ShinyButton } from "./shiny-btn"

// export function Navbar() {
//   const scrollToSection = (id) => {
//     const element = document.getElementById(id)
//     if (element) {
//       element.scrollIntoView({ behavior: "smooth" })
//     }
//   }

//   return (
//     <nav className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md">
//       <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between px-6">
//         <div className="flex items-center gap-2 font-bold">
//           <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
//             <Wallet className="h-4 w-4" />
//           </span>
//           Finch
//         </div>

//         <div className="hidden gap-7 text-sm text-muted-foreground md:flex">
//           <button
//             type="button"
//             onClick={() => scrollToSection("showcase")}
//             className="hover:text-foreground transition-colors cursor-pointer"
//           >
//             The dashboard
//           </button>
//           <button
//             type="button"
//             onClick={() => scrollToSection("features")}
//             className="hover:text-foreground transition-colors cursor-pointer"
//           >
//             What it does
//           </button>
//         </div>

//         <div className="flex items-center gap-2">
//           <Button variant="ghost" asChild>
//             <Link to="/auth/login">Sign in</Link>
//           </Button>
//           <ShinyButton>
//             <Link to="/auth/signup">Get started</Link>
//           </ShinyButton>
//         </div>
//       </div>
//     </nav>
//   )
// }
// src/components/landing/navbar.jsx

import { Link } from "react-router-dom"
import { Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ShinyButton } from "./shiny-btn"

export function Navbar() {
  const scrollToSection = (id) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <nav className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:h-[68px] sm:px-6">
        <div className="flex min-w-0 items-center gap-4 sm:gap-8">
          <div className="flex shrink-0 items-center gap-2 font-bold">
            <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
              <Wallet className="size-4" />
            </span>
            Finch
          </div>

          <button
            type="button"
            onClick={() => scrollToSection("features")}
            className="hidden cursor-pointer text-sm text-muted-foreground transition-colors hover:text-foreground md:block"
          >
            Features
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Button variant="ghost" className="px-2 sm:px-4" asChild>
            <Link to="/auth/login">Sign in</Link>
          </Button>
          <ShinyButton className="px-3 sm:px-5">
            <Link to="/auth/signup">Get started</Link>
          </ShinyButton>
        </div>
      </div>
    </nav>
  )
}