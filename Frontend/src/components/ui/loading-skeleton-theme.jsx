import Skeleton, { SkeletonTheme } from "react-loading-skeleton"
import "react-loading-skeleton/dist/skeleton.css"

export function LoadingSkeletonTheme({ children }) {
  return (
    <SkeletonTheme baseColor="#1f2937" highlightColor="#374151">
      {children}
    </SkeletonTheme>
  )
}

export { Skeleton }
