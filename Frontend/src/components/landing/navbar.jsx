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
//             <Link to="/sign-in">Sign in</Link>
//           </Button>
//           <ShinyButton>
//             <Link to="/sign-up">Get started</Link>
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
     <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between px-6">
  {/* Left Group: Logo + Navigation */}
  <div className="flex items-center gap-8">
    <div className="flex items-center gap-2 font-bold">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
        <Wallet className="h-4 w-4" />
      </span>
      Finch
    </div>

    <button
      type="button"
      onClick={() => scrollToSection("features")}
      className="hidden text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer md:block"
    >
      Features
    </button>
  </div>

  {/* Right Group: Auth CTAs */}
  <div className="flex items-center gap-2">
    <Button variant="ghost" asChild>
      <Link to="/sign-in">Sign in</Link>
    </Button>
    <ShinyButton>
      <Link to="/sign-up">Get started</Link>
    </ShinyButton>
  </div>
</div>
    </nav>
  )
}