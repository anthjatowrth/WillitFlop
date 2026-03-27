/**
 * TacticalAlerts — "Tactical Alerts" list card (col-span-6)
 * Variant → Tailwind classes mapping lives here (not in data) to avoid purge issues.
 */
import { tacticalAlerts } from '../../data/marketStats'

/** Static maps keep all Tailwind strings visible to the scanner */
const VARIANT = {
  primary: {
    wrap:   'bg-primary/5 border-l-4 border-primary',
    icon:   'text-primary',
  },
  tertiary: {
    wrap:   'bg-tertiary/5 border-l-4 border-tertiary',
    icon:   'text-tertiary',
  },
  secondary: {
    wrap:   'bg-muted/30 border-l-4 border-muted-foreground',
    icon:   'text-muted-foreground',
  },
}

export default function TacticalAlerts() {
  return (
    <div className="md:col-span-6 bg-surface-container-lowest p-8 border border-outline-variant/15">
      <h3 className="font-space-grotesk text-xl font-bold mb-6">Tactical Alerts</h3>

      <div className="space-y-4">
        {tacticalAlerts.map((alert) => {
          const styles = VARIANT[alert.variant] ?? VARIANT.secondary
          return (
            <div
              key={alert.id}
              className={`p-4 flex gap-4 ${styles.wrap} ${alert.muted ? 'opacity-70' : ''}`}
            >
              <span
                className={`material-symbols-outlined flex-shrink-0 ${styles.icon}`}
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {alert.icon}
              </span>
              <div>
                <div className="font-space-grotesk font-bold text-sm">{alert.title}</div>
                <div className="font-manrope text-xs text-muted-foreground mt-1">{alert.body}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
