import { SourceList } from '../../components/forms/SourceList';
import { ExternalLink, Notice, PageHeader } from '../../components/ui';
import { vhfNotice, vhfStations, workingChannel } from '../../content/nav/vhf';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { Link } from '../../router/Router';

export function StationsPage() {
  useDocumentTitle('VHF station list and channels');
  const changed = vhfStations.filter((s) => s.oldChannel).length;
  return (
    <div className="container page">
      <PageHeader
        title="VHF station list and channels"
        icon="radio"
        intro="Irish Coast Guard VHF stations and their channels, from Marine Notice 61 of 2020."
        crumb={{ label: 'VHF Radio', to: '/vhf' }}
      />
      <Notice tone="warning" title="A snapshot from December 2020: check the current notice">
        This table comes from {vhfNotice.number}, dated {vhfNotice.date}, as published by afloat.ie, not from the gov.ie original, which could not be fetched here. Later notices have not
        been checked, so confirm the channels against the current Coast Guard information before relying on them. Channel 16 is not affected by the changes.
      </Notice>
      <ul className="plain-list">
        <li>Every station listens on channel 16. Channel 67 is available when required but may not be monitored at all times.</li>
        <li>The notice’s poster lists DSC channel 70 for distress alerting at the stations marked below.</li>
        <li>
          {changed} of the {vhfStations.length} rows had a working channel changed by the notice. The old channel is shown so that older sheets and notes can be checked.
        </li>
      </ul>
      <div>
        <table className="calc__table calc__table--stack">
          <caption className="sr-only">Irish Coast Guard stations and VHF channels</caption>
          <thead>
            <tr>
              <th scope="col">Station</th>
              <th scope="col">Channels listed</th>
              <th scope="col">Working channel</th>
              <th scope="col">DSC 70</th>
              <th scope="col">Changed in 2020</th>
            </tr>
          </thead>
          <tbody>
            {vhfStations.map((s) => (
              <tr key={s.name}>
                <th scope="row">
                  {s.name}
                  {s.note ? <span className="muted station-note"> {s.note}</span> : null}
                </th>
                <td data-label="Channels listed">{s.channels.join(', ')}</td>
                <td data-label="Working channel">{workingChannel(s) ?? 'None listed'}</td>
                <td data-label="DSC 70">{s.dsc ? 'Listed' : 'Not listed'}</td>
                <td data-label="Changed in 2020">{s.oldChannel ? `Yes, from ${s.oldChannel}` : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <section className="block-tight" aria-labelledby="notice-title">
        <h2 id="notice-title">The notice</h2>
        <ul className="plain-list">
          <li>
            <ExternalLink href={vhfNotice.gov}>Marine Notices 2020 on gov.ie</ExternalLink> (the notice is number 61).
          </li>
          <li>
            <ExternalLink href={vhfNotice.reproduction}>The copy on afloat.ie</ExternalLink>, which this table was read from.
          </li>
          <li>The notice also carries a map of the radio sites and a guide to sending VHF distress alerts and calls.</li>
        </ul>
        <p className="muted">
          Control areas, a station map and radio procedures are not on this app yet. See <Link to="/vhf">VHF Radio</Link> for why.
        </p>
      </section>
      <SourceList ids={['mn61']} />
    </div>
  );
}
