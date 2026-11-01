import { useState, type ReactNode } from 'react';
import { SourceList } from '../../components/forms/SourceList';
import { TextField, TimeField } from '../../components/forms/fields';
import { Notice, PageHeader } from '../../components/ui';
import {
  addOneHour,
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
    <Calc
      id="thirds"
      title="Rule of thirds: stream rate by hour"
      formula="Counting the hours of a stream from slack water, the rate in hours 1 to 6 is 1/3, 2/3, full, full, 2/3 and 1/3 of the full rate."
      assumptions={[
        'The slides give the fractions as "of flow". This calculator applies them to the full (maximum) rate that you enter, in knots.',
        'It is a rule of thumb for a stream that runs for about six hours. Real streams vary with the place, so use an atlas or the local guide where you have one.',
        'The hours are counted from slack water, as the slides lay them out.',
      ]}
      source="Shearwater Tides deck (rule of thirds)"
    >
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
    <Calc
      id="twelfths"
      title="Rule of twelfths: height of the tide by hour"
      formula="In hours 1 to 6 the tide moves 1, 2, 3, 3, 2 and 1 twelfths of its range."
      assumptions={[
        'The slides lay the rule out as high water, then one to five hours after, then low water: a six-hour rise or fall.',
        'Heights come out in the datum you type them in. Use the same datum for both heights, and check it before comparing with a charted depth.',
        'It is a rule of thumb, not a tide table. Real tides do not follow it exactly, so use the predicted heights where you have them.',
      ]}
      source="Shearwater Tides deck (rule of twelfths)"
    >
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
    <Calc
      id="fromhw"
      title="Time from high water: local port high water, or when a stream starts"
      formula="Time = the high water time at the standard port, plus the offset if it is after, or minus it if it is before."
      assumptions={[
        'Oileáin and the Shearwater slides give a local high water, or the start of a stream, as hours and minutes before or after high water at a named standard port. This calculator does that sum.',
        'The answer is in the same clock as the time you enter. If your table is in UT and the day is in summer time, add one hour with the BST calculator below.',
        'It uses only the offsets you type. It does not look up any standard port or offset.',
      ]}
      source="Oileáin (standard-port convention, from the supplied PDF) and the Shearwater Tides deck"
    >
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
    <Calc
      id="bst"
      title="Universal time to British Summer Time"
      formula="Add one hour."
      assumptions={[
        'Use it only when the tide table is in universal time (UT or GMT) and the date falls in summer time. Check the time zone the table says it uses before you add an hour, so you do not add it twice or miss it.',
        'The calculator does not know the dates of summer time.',
      ]}
      source="Shearwater Tides deck (the tide table example) and the planner's “+1 hr for BST” box"
    >
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
    <Calc
      id="offset"
      title="Offset angle for a stream"
      formula="Angle = (stream speed ÷ paddling speed) × 60° for a stream on the beam, or × 40° for a stream on the bow or quarter."
      assumptions={[
        'Both speeds in knots, paddling speed through the water. The angle is how far to aim up-stream of your destination, in degrees.',
        'The slides give the factors 60 and 40 and no limits. If the stream is as fast as you paddle, or faster, no angle will hold the course, so the calculator says so instead of giving a number.',
        'A rule of thumb for planning, not a bearing to steer blindly: plot a course to steer on the chart and check it as you go.',
      ]}
      source="Shearwater Pilotage deck (offset for current speed)"
    >
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
    <Calc
      id="streamspeed"
      title="Speed of a stream from distance and time"
      formula="Speed over the ground = distance ÷ time. Stream speed = speed over the ground − your speed through the water."
      assumptions={[
        'Paddle straight along the stream at a steady speed, and measure the distance made good over the ground in nautical miles and the time in minutes.',
        'A positive result means the stream is with you and a negative one means it is against you. The calculator says which.',
        'Your speed through the water has to be known. The slides use 3 knots as an example, and that is a value you enter, not a default.',
      ]}
      source="Shearwater Pilotage deck (estimate the speed of a tidal stream). The slides’ worked example: 0.7 mile in 10 minutes is 4.2 knots, and with a boat speed of 3 knots the stream is 1.2 knots."
    >
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
    <Calc
      id="atlas"
      title="Reading a rate on a tidal stream atlas"
      formula="A rate printed as two numbers with a comma, such as 12,23, means 1.2 knots at neaps and 2.3 knots at springs."
      assumptions={[
        'The comma stands for the decimal point: the first number is the neap rate and the second the spring rate, each in tenths of a knot.',
        'Enter exactly two digits either side of the comma. Other formats are not decoded.',
      ]}
      source="Shearwater Tides deck (the atlas example: 03,05 is 0.3 knots at neaps and 0.5 knots at springs)"
    >
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
    <Calc
      id="cables"
      title="Cables and nautical miles"
      formula="1 nautical mile = 10 cables. One minute of latitude is one nautical mile."
      assumptions={['Measure distance on the latitude scale at the side of the chart, never on the longitude scale.', 'The slides’ worked example: 8.5 cables is 0.85 nautical miles.']}
      source="Shearwater Chartwork deck"
    >
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
