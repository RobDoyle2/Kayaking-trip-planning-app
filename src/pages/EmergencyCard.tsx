import { emergencyNotIncluded, knowBeforeLaunch, rescuePriorities } from '../content/emergency';
import { club } from '../clubs';
import { Badge, ButtonLink, Notice, PageHeader } from '../components/ui';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

/**
 * Emergency card. Every line below is taken from a published source named at the bottom of the page.
 * Nothing here is invented. It is a PREVIEW until the ECSKC committee approves the wording.
 * Offline use is not built yet (it needs a service worker, which is a separate decision).
 */
export function EmergencyCard() {
  useDocumentTitle('Emergency card');

  return (
    <div className="container page emergency">
      <PageHeader title="Emergency card" icon="alert" crumb={{ label: 'Home', to: '/' }} />

      <Notice tone="warning" title="Preview: not yet approved by the club">
        The wording comes from the published sources listed at the foot of this page. It has not been approved by the ECSKC
        committee. Check it against the club's own procedures. This page needs a signal to load: offline use is not built
        yet, so note the numbers down before you go.
      </Notice>

      <section className="emergency__call" aria-labelledby="call-title">
        <h2 id="call-title">In an emergency</h2>
        <ol className="emergency__steps">
          <li>
            <strong>Dial {club.emergency.numbers} and ask for the Coast Guard.</strong>
          </li>
          <li>
            <strong>To reach the Coast Guard by radio, use VHF channel {club.emergency.vhfChannel}.</strong>
          </li>
        </ol>
        <div className="emergency__buttons">
          <ButtonLink href="tel:999" variant="danger" size="large">
            Call 999
          </ButtonLink>
          <ButtonLink href="tel:112" variant="danger" size="large">
            Call 112
          </ButtonLink>
        </div>
      </section>

      <section className="block-tight" aria-labelledby="think-title">
        <h2 id="think-title">While you act</h2>
        <ul className="plain-list">
          {rescuePriorities.map((r) => (
            <li key={r.title}>
              <strong>{r.title}</strong> {r.text}
            </li>
          ))}
        </ul>
      </section>

      <section className="block-tight" aria-labelledby="know-title">
        <h2 id="know-title">Know before you launch</h2>
        <p>{knowBeforeLaunch}</p>
      </section>

      <Notice title="Not included yet">
        {emergencyNotIncluded}
      </Notice>

      <section className="block-tight" aria-labelledby="src-title">
        <h2 id="src-title">
          Sources <Badge tone="notice">Preview</Badge>
        </h2>
        <ul className="plain-list">
          <li>{club.emergency.source}</li>
          <li>
            Irish Coast Guard, Marine Notice 61 of 2020 (16 December 2020): in distress, or seeing someone in difficulty,
            dial 999 or 112 and ask for the Coast Guard. Read through a reproduction on afloat.ie, not the gov.ie original.
          </li>
          <li>
            British Canoeing Awarding Body, Sea Kayak Leader Assessment Guidance (emergency sequence and rescue
            principles). The October 2021 edition was supplied; the wording was also checked against the March 2024
            edition (V1-6), pages 8 and 9.
          </li>
          <li>
            British Canoeing, Foundation Safety and Rescue Training Course Notes, V2-5 February 2019 (priority order,
            risk ladder and the accident plan).
          </li>
        </ul>
      </section>
    </div>
  );
}
