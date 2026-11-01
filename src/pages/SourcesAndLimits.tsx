import { club } from '../clubs';
import { ExternalLink, Notice, PageHeader } from '../components/ui';
import { approvalLabel, referenceDocuments } from '../content/documents';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { Link } from '../router/Router';

interface LiveSource {
  source: string;
  use: string;
  rules: string;
}

/** Live sources looked at. None is connected; the page says so and says why. */
const liveSources: LiveSource[] = [
  {
    source: 'Marine Institute tide prediction',
    use: 'Predicted tide times and heights, measured above Lowest Astronomical Tide.',
    rules: 'Creative Commons Attribution 4.0. Shown as a prediction, with its source and time. Two related datasets name their height columns differently, so the datum has to be checked first.',
  },
  {
    source: 'Met Éireann forecasts',
    use: 'Text forecasts (sea area, coastal reports) and point forecasts.',
    rules: 'Credit Met Éireann, and show its weather warnings alongside forecast data. The service is described as best effort and has been scheduled for an upgrade.',
  },
  {
    source: 'Marine Institute weather buoys',
    use: 'Observed wind and waves at the buoys that are reporting.',
    rules: 'Creative Commons Attribution 4.0. Buoys can be offline; missing values will be shown as missing.',
  },
];

export function SourcesAndLimits() {
  useDocumentTitle('Sources and limits');

  return (
    <div className="container page prose">
      <PageHeader
        title="Sources and limits"
        icon="info"
        intro="What this app is built from, what it cannot do, and how your information is handled."
        crumb={{ label: 'Home', to: '/' }}
      />

      <Notice tone="warning" title="A planning aid, not a safety system">
        {club.appName} does not replace training, a current forecast, chart work or the leader's judgement. Check
        conditions yourself before every trip.
      </Notice>

      <section aria-labelledby="live-title">
        <h2 id="live-title">What is live and what is only linked</h2>
        <p>
          <strong>Nothing in the app is live.</strong> No weather, tide or radio data is fetched. The Navigation and VHF pages link to the
          providers instead, marked “Not live here”. The sources below were looked at for a live connection and are not connected,
          because none could be downloaded and tested from where the app was built, and a tide or weather figure on a safety aid must
          not be shown unchecked. Any connection added later will show its source, place, units, update time and limitation, and if a
          feed cannot be reached you will see a message and a link to the provider, never a made-up value.
        </p>
        <div className="table-wrap">
          <table>
            <caption className="sr-only">Live data sources looked at</caption>
            <thead>
              <tr>
                <th scope="col">Source</th>
                <th scope="col">What it could offer</th>
                <th scope="col">Rules that apply</th>
                <th scope="col">Status today</th>
              </tr>
            </thead>
            <tbody>
              {liveSources.map((row) => (
                <tr key={row.source}>
                  <th scope="row">{row.source}</th>
                  <td>{row.use}</td>
                  <td>{row.rules}</td>
                  <td>Not connected</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Everything else will be a plain link to the owner's own site, for example{' '}
          <ExternalLink href={club.website.url}>{club.website.label}</ExternalLink>, Canoeing Ireland, Windy and
          Tide-Forecast.com.
        </p>
      </section>

      <section aria-labelledby="limits-title">
        <h2 id="limits-title">Limits you should know</h2>
        <ul className="plain-list">
          <li>
            <strong>Predictions are not conditions.</strong> Tide times and heights, forecasts and stream rates are
            predictions. Wind, pressure and swell can shift real timings. Predictions and observations will always be
            shown separately.
          </li>
          <li>
            <strong>Datums and clocks.</strong> Charted depths use chart datum, which is close to Lowest Astronomical
            Tide. Some tide websites use Mean Lower Low Water, so heights from different sources are not interchangeable.
            Times will always be labelled, with the summer-time adjustment made once.
          </li>
          <li>
            <strong>Award limits are not club rules.</strong> The 2 knot, no-race, Beaufort 4, 1 metre surf and 2 nautical
            mile figures come from the British Canoeing Sea Kayak Leader assessment guidance. The October 2021 edition was
            supplied. The March 2024 edition (V1-6) is online, and I checked that it gives the same figures. The app will show
            them as information only.
          </li>
          <li>
            <strong>Source age.</strong> Check tide tables, access notes and landing advice before each trip. The edition of
            the Oileáin PDF is not stated and it does not match the printed second edition.
          </li>
          <li>
            <strong>VHF channels change.</strong> The Coast Guard changed several working channels in 2020 and listed the new
            ones in Marine Notice 61 of 2020, dated 16 December 2020. The station sheet supplied to this project shows the
            older channel for 11 of its 16 stations, so it will not be used as it stands. I found no newer notice, but that
            search was not exhaustive.
          </li>
          <li>
            <strong>The assistant</strong> answers only from the app’s own sourced pages, which paraphrase the documents supplied to this project, and shows
            the passages each answer rests on. It says when it cannot find something, and it never shows an answer it cannot tie to a passage. None of the
            documents has been approved by the club. It can still misread a passage, so each answer links to the page it cites. It needs a Claude API key to be set up on the server; without
            one it says it is not switched on.
          </li>
          <li>
            <strong>Third-party material.</strong> Much of the reference material belongs to others. Before their text
            appears on a public page, the club needs permission or a decision to link and paraphrase instead.
          </li>
        </ul>
      </section>

      <section aria-labelledby="saving-title">
        <h2 id="saving-title">How saving works</h2>
        <p>There are two ways an app can keep your information. This app uses the first, and says so whenever it saves.</p>
        <div className="two-col">
          <div className="panel">
            <h3>In this browser (what the app uses)</h3>
            <ul className="plain-list">
              <li>The plan stays on this device, in this browser. It is not sent to us.</li>
              <li>It does not appear on another phone, computer or browser.</li>
              <li>Clearing your browser data, or using a private window, erases it.</li>
              <li>Use the export button to keep a copy or move it.</li>
            </ul>
          </div>
          <div className="panel">
            <h3>On a server (not built)</h3>
            <ul className="plain-list">
              <li>The plan is kept on a server and can be opened from any device with a link.</li>
              <li>It needs a database and has privacy and cost consequences.</li>
              <li>
                <strong>Nothing is saved on a server today.</strong> This is left for a later phase.
              </li>
            </ul>
          </div>
        </div>
        <p>
          The Leadership checklists, SHEETS briefing, risk assessment, review, trip plans, skills development plan and personal checklists save in this browser as you change them, and
          each page says when it has saved. Visiting a page saves nothing. <Link to="/my-plans">My plans</Link> lists what is saved and lets
          you download, import or delete it. Nothing is saved on a server.
        </p>
      </section>

      <section aria-labelledby="privacy-title">
        <h2 id="privacy-title">Privacy and access</h2>
        <ul className="plain-list">
          <li>There are no accounts, and the app collects no personal information.</li>
          <li>
            <strong>Not promoted or indexed is not private.</strong> The app asks search engines to stay away, but anyone
            who has the link can open it. Do not put anything in it that you would not want a stranger to read.
          </li>
          <li>
            When you ask the assistant a question, the question is sent to this app’s server and then to Anthropic, which provides the Claude service, along with the passages the
            search picked. Nothing else is sent: your plans, names and notes stay on your device. The app does not keep your questions. Please do not type names or personal details into the assistant.
          </li>
          <li>Visitors cannot change the reference library or the app's settings.</li>
        </ul>
      </section>

      <section aria-labelledby="docs-title">
        <h2 id="docs-title">Documents supplied to the project</h2>
        <p>
          These are the documents the assistant will search once it is connected. None has been approved for that use yet,
          and permission to show their text publicly has not been settled.
        </p>
        <div className="table-wrap">
          <table>
            <caption className="sr-only">Reference documents and their approval status</caption>
            <thead>
              <tr>
                <th scope="col">Document</th>
                <th scope="col">Publisher</th>
                <th scope="col">Version</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {referenceDocuments.map((doc) => (
                <tr key={doc.id}>
                  <th scope="row">{doc.title}</th>
                  <td>{doc.publisher}</td>
                  <td>{doc.version}</td>
                  <td>{approvalLabel(doc.approval)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
