import { useState, type ReactNode } from 'react';
import { SourceList } from '../../components/forms/SourceList';
import { TextField, TimeField } from '../../components/forms/fields';
import { Notice, PageHeader } from '../../components/ui';
import {
  addOneHour,
  calcRules,
  cablesToNm,
  currentOffset,
  dayShiftNote,
  decodeAtlasRate,
  nmToCables,
  parseNumber,
  ruleOfThirds,
  ruleOfTwelfths,
  streamSpeed,
  timeFromHighWater,
  type CurrentKind,
} from '../../content/nav/calc';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { Link } from '../../router/Router';

function Calc({ id, title, formula, assumptions, source, children }: { id: string; title: string; formula: string; assumptions: string[]; source: string; children: ReactNode }) {
  return (
    <section className="calc group" aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}>{title}</h2>
      <p className="calc__formula">
        <strong>Rule:</strong> {formula}
      </p>
      {children}
      <details className="calc__more">
        <summary>Assumptions and source</summary>
        <ul className="plain-list">
          {assumptions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
        <p className="muted">Source: {source}</p>
      </details>
    </section>
  );
}

function Result({ children, tone = 'ok' }: { children: ReactNode; tone?: 'ok' | 'problem' | 'wait' }) {
  return (
    <p className={`calc__result calc__result--${tone}`} role="status">
      {children}
    </p>
  );
}

function SelectField({ id, label, value, onChange, options }: { id: string; label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <select id={id} className="input input--short" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

const fmt = (n: number) => String(n);

function ThirdsCalc() {
  const [max, setMax] = useState('');
  const p = parseNumber(max, { min: 0, max: 20, label: 'Full rate' });
  return (
    <Calc id="thirds" {...calcRules.thirds}>
      <TextField id="thirds-max" label="Full rate of the stream (knots)" hint="For example 2.4. A stream atlas gives a spring and a neap rate." value={max} onChange={setMax} />
      {max.trim() === '' ? (
        <Result tone="wait">Enter the full rate to see the rate in each hour.</Result>
      ) : !p.ok ? (
        <Result tone="problem">{p.message}</Result>
      ) : (
        <table className="calc__table">
          <caption className="sr-only">Stream rate in each hour</caption>
          <thead>
            <tr>
              <th scope="col">Hour</th>
              <th scope="col">Fraction of full rate</th>
              <th scope="col">Rate (knots)</th>
            </tr>
          </thead>
          <tbody>
            {ruleOfThirds(p.value).map((r) => (
              <tr key={r.hour}>
                <td>{r.hour}</td>
                <td>{r.label}</td>
                <td>{fmt(r.rateKn)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Calc>
  );
}

function TwelfthsCalc() {
  const [low, setLow] = useState('');
  const [high, setHigh] = useState('');
  const [dir, setDir] = useState('rising');
  const l = parseNumber(low, { allowNegative: true, min: -10, max: 20, label: 'Low water height' });
  const h = parseNumber(high, { allowNegative: true, min: -10, max: 20, label: 'High water height' });
  const out = l.ok && h.ok ? ruleOfTwelfths(l.value, h.value, dir === 'falling' ? 'falling' : 'rising') : null;
  return (
    <Calc id="twelfths" {...calcRules.twelfths}>
      <TextField id="twelfths-low" label="Height at low water (metres)" value={low} onChange={setLow} />
      <TextField id="twelfths-high" label="Height at high water (metres)" value={high} onChange={setHigh} />
      <SelectField
        id="twelfths-dir"
        label="Which way is the tide going"
        value={dir}
        onChange={setDir}
        options={[
          { value: 'rising', label: 'Rising from low water' },
          { value: 'falling', label: 'Falling from high water' },
        ]}
      />
      {low.trim() === '' || high.trim() === '' ? (
        <Result tone="wait">Enter both heights to see the height at the end of each hour.</Result>
      ) : !l.ok ? (
        <Result tone="problem">{l.message}</Result>
      ) : !h.ok ? (
        <Result tone="problem">{h.message}</Result>
      ) : !out ? (
        <Result tone="problem">High water must be higher than low water.</Result>
      ) : (
        <>
          <Result>Range {fmt(out.rangeM)} m.</Result>
          <table className="calc__table">
            <caption className="sr-only">Height at the end of each hour</caption>
            <thead>
              <tr>
                <th scope="col">Hour</th>
                <th scope="col">Twelfths this hour</th>
                <th scope="col">Twelfths so far</th>
                <th scope="col">Height (m)</th>
              </tr>
            </thead>
            <tbody>
              {out.rows.map((r) => (
                <tr key={r.hour}>
                  <td>{r.hour}</td>
                  <td>{r.changeTwelfths}</td>
                  <td>{r.cumulativeTwelfths}</td>
                  <td>{fmt(r.heightM)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </Calc>
  );
}

function FromHighWaterCalc() {
  const [hw, setHw] = useState('');
  const [dir, setDir] = useState('after');
  const [hours, setHours] = useState('');
  const [mins, setMins] = useState('');
  const hh = parseNumber(hours === '' ? '0' : hours, { min: 0, max: 12, label: 'Hours' });
  const mm = parseNumber(mins === '' ? '0' : mins, { min: 0, max: 59, label: 'Minutes' });
  const ready = hw !== '' && (hours.trim() !== '' || mins.trim() !== '');
  const res = hh.ok && mm.ok ? timeFromHighWater(hw, dir === 'before' ? 'before' : 'after', Math.floor(hh.value), Math.floor(mm.value)) : null;
  return (
    <Calc id="fromhw" {...calcRules.fromhw}>
      <TimeField id="fromhw-hw" label="High water at the standard port (time)" value={hw} onChange={setHw} />
      <SelectField
        id="fromhw-dir"
        label="Offset is"
        value={dir}
        onChange={setDir}
        options={[
          { value: 'after', label: 'After high water' },
          { value: 'before', label: 'Before high water' },
        ]}
      />
      <TextField id="fromhw-hours" label="Offset hours" value={hours} onChange={setHours} />
      <TextField id="fromhw-mins" label="Offset minutes" value={mins} onChange={setMins} />
      {!ready ? (
        <Result tone="wait">Enter a high water time and an offset.</Result>
      ) : !hh.ok ? (
        <Result tone="problem">{hh.message}</Result>
      ) : !mm.ok ? (
        <Result tone="problem">{mm.message}</Result>
      ) : !res ? (
        <Result tone="problem">Enter the high water time as hours and minutes.</Result>
      ) : (
        <Result>
          Result: {res.time}
          {dayShiftNote(res.dayShift)}, in the same clock as the time you entered.
        </Result>
      )}
    </Calc>
  );
}

function BstCalc() {
  const [t, setT] = useState('');
  const res = t ? addOneHour(t) : null;
  return (
    <Calc id="bst" {...calcRules.bst}>
      <TimeField id="bst-time" label="Time from a table in UT" value={t} onChange={setT} />
      {!t ? <Result tone="wait">Enter a time.</Result> : !res ? <Result tone="problem">Enter the time as hours and minutes.</Result> : <Result>BST: {res.time}{dayShiftNote(res.dayShift)}.</Result>}
    </Calc>
  );
}

function OffsetCalc() {
  const [stream, setStream] = useState('');
  const [paddle, setPaddle] = useState('');
  const [kind, setKind] = useState('beam');
  const c = parseNumber(stream, { min: 0, max: 30, label: 'Stream speed' });
  const p = parseNumber(paddle, { min: 0.1, max: 15, label: 'Paddling speed' });
  const res = c.ok && p.ok ? currentOffset(c.value, p.value, kind === 'quarter' ? 'quarter' : ('beam' as CurrentKind)) : null;
  return (
    <Calc id="offset" {...calcRules.offset}>
      <TextField id="offset-stream" label="Stream speed (knots)" value={stream} onChange={setStream} />
      <TextField id="offset-paddle" label="Your paddling speed (knots)" value={paddle} onChange={setPaddle} />
      <SelectField
        id="offset-kind"
        label="Where the stream comes from"
        value={kind}
        onChange={setKind}
        options={[
          { value: 'beam', label: 'On the beam (from the side)' },
          { value: 'quarter', label: 'On the bow or quarter' },
        ]}
      />
      {stream.trim() === '' || paddle.trim() === '' ? (
        <Result tone="wait">Enter both speeds.</Result>
      ) : !c.ok ? (
        <Result tone="problem">{c.message}</Result>
      ) : !p.ok ? (
        <Result tone="problem">{p.message}</Result>
      ) : !res ? null : !res.ok ? (
        <Result tone="problem">{res.message}</Result>
      ) : (
        <Result>
          Offset: {fmt(res.degrees)}° up-stream (stream ÷ paddling speed = {fmt(res.ratio)}, × {res.factor}°).
        </Result>
      )}
    </Calc>
  );
}

function StreamSpeedCalc() {
  const [dist, setDist] = useState('');
  const [min, setMin] = useState('');
  const [boat, setBoat] = useState('');
  const d = parseNumber(dist, { min: 0.01, max: 50, label: 'Distance' });
  const m = parseNumber(min, { min: 1, max: 600, label: 'Time' });
  const b = parseNumber(boat, { min: 0, max: 15, label: 'Your speed through the water' });
  const res = d.ok && m.ok && b.ok ? streamSpeed(d.value, m.value, b.value) : null;
  return (
    <Calc id="streamspeed" {...calcRules.streamspeed}>
      <TextField id="streamspeed-dist" label="Distance over the ground (nautical miles)" value={dist} onChange={setDist} />
      <TextField id="streamspeed-min" label="Time taken (minutes)" value={min} onChange={setMin} />
      <TextField id="streamspeed-boat" label="Your speed through the water (knots)" value={boat} onChange={setBoat} />
      {dist.trim() === '' || min.trim() === '' || boat.trim() === '' ? (
        <Result tone="wait">Enter the distance, the time and your speed.</Result>
      ) : !d.ok ? (
        <Result tone="problem">{d.message}</Result>
      ) : !m.ok ? (
        <Result tone="problem">{m.message}</Result>
      ) : !b.ok ? (
        <Result tone="problem">{b.message}</Result>
      ) : !res ? null : (
        <Result>
          Speed over the ground {fmt(res.groundSpeedKn)} knots.{' '}
          {res.direction === 'none' ? 'No stream detected.' : `Stream ${fmt(res.streamKn)} knots, ${res.direction === 'with' ? 'with you' : 'against you'}.`}
        </Result>
      )}
    </Calc>
  );
}

function AtlasCalc() {
  const [text, setText] = useState('');
  const res = decodeAtlasRate(text);
  return (
    <Calc id="atlas" {...calcRules.atlas}>
      <TextField id="atlas-rate" label="Rate as printed on the atlas" hint="For example 12,23" value={text} onChange={setText} />
      {text.trim() === '' ? (
        <Result tone="wait">Enter a rate such as 12,23.</Result>
      ) : !res ? (
        <Result tone="problem">Enter two digits, a comma and two digits, for example 12,23.</Result>
      ) : (
        <Result>
          {fmt(res.neapsKn)} knots at neaps, {fmt(res.springsKn)} knots at springs.
        </Result>
      )}
    </Calc>
  );
}

function CablesCalc() {
  const [cables, setCables] = useState('');
  const [nm, setNm] = useState('');
  const c = parseNumber(cables, { min: 0, max: 100000, label: 'Cables' });
  const n = parseNumber(nm, { min: 0, max: 10000, label: 'Nautical miles' });
  return (
    <Calc id="cables" {...calcRules.cables}>
      <TextField id="cables-in" label="Cables" value={cables} onChange={setCables} />
      {cables.trim() === '' ? <Result tone="wait">Enter cables to convert to nautical miles.</Result> : !c.ok ? <Result tone="problem">{c.message}</Result> : <Result>{fmt(cablesToNm(c.value))} nautical miles.</Result>}
      <TextField id="nm-in" label="Nautical miles" value={nm} onChange={setNm} />
      {nm.trim() === '' ? <Result tone="wait">Enter nautical miles to convert to cables.</Result> : !n.ok ? <Result tone="problem">{n.message}</Result> : <Result>{fmt(nmToCables(n.value))} cables.</Result>}
    </Calc>
  );
}

export function CalculatorsPage() {
  useDocumentTitle('Tide worksheet and calculators');
  return (
    <div className="container page">
      <PageHeader
        title="Tide worksheet and calculators"
        icon="compass"
        intro="Simple sums from the navigation sources. Type in values from your own tables and chart."
        crumb={{ label: 'Navigation and Tides', to: '/navigation' }}
      />
      <Notice tone="warning" title="A planning aid, not a navigator">
        These calculators do arithmetic on what you type. They fetch nothing, look nothing up and save nothing. They do not replace a current tide table, a chart, a
        forecast or your own judgement, so check every result. Every rule here comes from the sources named under it. The Oileáin high-water allowance is not here
        because no rule for it was found (see <Link to="/navigation">Navigation and Tides</Link>).
      </Notice>
      <FromHighWaterCalc />
      <BstCalc />
      <ThirdsCalc />
      <TwelfthsCalc />
      <OffsetCalc />
      <StreamSpeedCalc />
      <AtlasCalc />
      <CablesCalc />
      <SourceList ids={['shearwater', 'oileain']} />
    </div>
  );
}
