import type { EconomyConfig, TierId, TierState } from "./types";
import { TierRing } from "./TierRing";

interface TierProgressRowProps {
  config: EconomyConfig;
  state: Record<TierId, TierState>;
}

// Bronze rendered larger/centered per spec ("יומי גדול במרכז, שבועי וחודשי
// קטנים יותר") — the first tier in config order gets the bigger ring, the
// rest get a smaller one, which naturally matches bronze/silver/gold order
// without hardcoding tier ids.
export function TierProgressRow({ config, state }: TierProgressRowProps) {
  const sorted = [...config.tiers].sort((a, b) => a.order - b.order);
  return (
    <div className="tier-progress-row">
      {sorted.map((tier, i) => (
        <div key={tier.id} className="tier-progress-row__item">
          <TierRing tier={tier} state={state[tier.id]} size={i === 0 ? 110 : 80} />
          <span className="tier-progress-row__label">{tier.label}</span>
        </div>
      ))}
    </div>
  );
}
