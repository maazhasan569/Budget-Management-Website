export function LogoHeader() {
  return (
    <div className="flex justify-center pb-2">
      <Link to="/" className="flex items-center gap-2 font-bold text-lg">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
          <Wallet className="h-5 w-5" />
        </span>
        Finch
      </Link>
    </div>
  )
}