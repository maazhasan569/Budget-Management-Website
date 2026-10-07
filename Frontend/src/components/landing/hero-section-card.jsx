// src/components/landing/hero-preview-cards.jsx
import { motion } from "framer-motion"
import { TrendingUp, ShieldCheck, Clock3 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export function HeroPreviewCards() {
  return (
    <div className="relative hidden h-full w-full md:block">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        whileHover={{ y: -4 }}
        className="absolute left-4 top-10 w-56"
      >
        <FloatCard
          icon={<ShieldCheck className="h-4 w-4 text-primary" />}
          label="Financial health score"
          value="82"
          sub="Good standing"
          float
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.25 }}
        whileHover={{ y: -4 }}
        className="absolute right-8 top-32 w-52"
      >
        <FloatCard
          icon={<TrendingUp className="h-4 w-4 text-success" />}
          label="Saved this month"
          value="$420"
          sub="+12% vs last month"
          float
          delay="1.2s"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        whileHover={{ y: -4 }}
        className="absolute left-16 top-[16rem] w-60"
      >
        <FloatCard
          icon={<Clock3 className="h-4 w-4 text-warning" />}
          label="Car loan installment"
          value="Due in 2d"
          sub="$180 remaining"
          float
          delay="2s"
        />
      </motion.div>
    </div>
  )
}

function FloatCard({ icon, label, value, sub, float, delay = "0s" }) {
  return (
    <Card
      className="border-white/10 bg-white/5 backdrop-blur-md shadow-lg"
      style={
        float
          ? { animation: `hero-float 5s ease-in-out infinite`, animationDelay: delay }
          : undefined
      }
    >
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs text-white/60">{label}</p>
          <p className="text-lg font-semibold text-white">{value}</p>
          <p className="truncate text-xs text-white/50">{sub}</p>
        </div>
      </CardContent>
    </Card>
  )
}