import { cn } from '@/lib/utils'

const variantClasses = {
  default:   'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  destructive: 'bg-destructive text-white',
  outline:   'border border-border text-foreground',
  ghost:     'text-foreground',
  link:      'text-primary underline-offset-4 hover:underline',
  // WillItFlop brand variants
  pink: 'text-primary bg-primary/10 border border-primary/25',
  cyan: 'text-accent bg-accent/10 border border-accent/25',
  ink:  'text-secondary-foreground bg-secondary border border-secondary-foreground/15',
}

function Badge({ className, variant = 'default', ...props }) {
  return (
    <span
      data-slot="badge"
      className={cn(
        'inline-flex w-fit shrink-0 items-center justify-center gap-1.5 overflow-hidden rounded-full px-4 py-1.5 text-xs font-medium whitespace-nowrap font-space-mono tracking-[0.1em]',
        variantClasses[variant] ?? variantClasses.default,
        className
      )}
      {...props}
    />
  )
}

export { Badge }
