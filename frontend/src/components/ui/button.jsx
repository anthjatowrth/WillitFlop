import { cn } from '@/lib/utils'

const variantClasses = {
  default:     'bg-primary text-primary-foreground hover:bg-primary/90',
  destructive: 'bg-destructive text-white hover:bg-destructive/90',
  outline:     'border border-border bg-background hover:bg-accent hover:text-accent-foreground',
  secondary:   'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  ghost:       'hover:bg-accent hover:text-accent-foreground',
  link:        'text-primary underline-offset-4 hover:underline',
}

const sizeClasses = {
  default: 'h-9 px-4 py-2 text-sm',
  xs:      'h-6 px-2 text-xs rounded-md',
  sm:      'h-8 px-3 text-sm rounded-md',
  lg:      'h-10 px-6 rounded-md',
  icon:    'size-9',
}

function Button({ className, variant = 'default', size = 'default', ...props }) {
  return (
    <button
      data-slot="button"
      className={cn(
        'inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-medium whitespace-nowrap transition-all outline-none disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant] ?? variantClasses.default,
        sizeClasses[size] ?? sizeClasses.default,
        className
      )}
      {...props}
    />
  )
}

export { Button }
