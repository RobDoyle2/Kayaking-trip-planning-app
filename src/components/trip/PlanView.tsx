import type { PlanDoc } from '../../content/trip/output';

/** The plan as it will print: title, what is still missing, then each section. */
export function PlanView({ doc }: { doc: PlanDoc }) {
  return (
    <section className="briefing plan-view" aria-labelledby="plan-title">
      <h2 id="plan-title">{doc.title}</h2>
      <p className="plan-view__subtitle">{doc.subtitle}</p>
      {doc.gaps.length > 0 ? (
        <div className="plan-view__gaps">
          <h3>Still to fill in ({doc.gaps.length})</h3>
          <ul className="plain-list">
            {doc.gaps.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="plan-view__ok">Every required field is filled in.</p>
      )}
      {doc.sections.map((s) => (
        <div key={s.heading} className="briefing__section">
          <h3>{s.heading}</h3>
          <dl className="plan-view__rows">
            {s.rows.map((r, i) => (
              <div key={`${r.label}-${i}`} className={r.gap ? 'is-gap' : undefined}>
                <dt>{r.label}</dt>
                <dd>{r.value}</dd>
              </div>
            ))}
          </dl>
          {(s.notes ?? []).map((n, i) => (
            <p key={i} className="plan-view__note">
              {n}
            </p>
          ))}
        </div>
      ))}
      <p className="briefing__foot muted">{doc.footer}</p>
    </section>
  );
}
