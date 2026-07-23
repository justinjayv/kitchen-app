/**
 * Small "measuring cup" style gauge that shows a recipe's ingredient
 * match percentage. Ticks echo measuring-cup gradations, tying the
 * visual language back to the kitchen subject.
 */
export default function MatchGauge({ percentage }) {
  const pct = Math.max(0, Math.min(100, percentage));
  const fillClass = pct === 100 ? "full" : pct < 50 ? "low" : "";

  return (
    <div className="gauge" title={`${pct}% of ingredients on hand`}>
      <div className="gauge-track">
        <div className={`gauge-fill ${fillClass}`} style={{ width: `${pct}%` }} />
        <div className="gauge-ticks">
          {[...Array(4)].map((_, i) => (
            <span key={i} />
          ))}
        </div>
      </div>
      <span className="gauge-label">{pct}%</span>
    </div>
  );
}
