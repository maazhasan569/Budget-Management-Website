import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export function EmptyDataState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionTo,
  className = "",
}) {
  return (
    <Empty className={`min-h-[190px] border border-dashed border-border bg-card px-5 py-7 ${className}`}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          {Icon && <Icon aria-hidden="true" />}
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {actionLabel && actionTo && (
        <EmptyContent>
          <Button asChild size="sm">
            <Link to={actionTo}>{actionLabel}</Link>
          </Button>
        </EmptyContent>
      )}
    </Empty>
  )
}
