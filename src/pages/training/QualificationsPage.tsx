import { SourceList } from '../../components/forms/SourceList';
import { ExternalLink, Notice, PageHeader } from '../../components/ui';
import { awardLevels, awardLinks, awardsCheckedOn } from '../../content/training/qualifications';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { Link } from '../../router/Router';

export function QualificationsPage() {
  useDocumentTitle('Canoeing Ireland qualifications');
  return (
    <div className="container page">
      <PageHeader
        title="Canoeing Ireland qualifications"
        icon="training"
        intro="The Sea Kayak Skills Awards, level by level, with a link to each page on canoe.ie."
        crumb={{ label: 'Training and Skills', to: '/training' }}
      />
      <Notice title="Links, not a copy">
        This page does not reproduce the awards. It names the levels and links to Canoeing Ireland, which is the authority. The notes below are short paraphrases of what the
        pages said when they were read on {awardsCheckedOn}. Requirements change, so check the page before you plan around one.
      </Notice>

      <ol className="item-list">
        {awardLevels.map((l) => (
          <li key={l.level} className="item-card">
            <div className="item-card__head">
              <h2>
                Level {l.level}: {l.name}
              </h2>
            </div>
            <p>{l.note}</p>
            <p>
              <ExternalLink href={l.url}>Level {l.level} {l.name} on canoe.ie</ExternalLink>
            </p>
          </li>
        ))}
      </ol>

      <section className="block-tight" aria-labelledby="more-title">
        <h2 id="more-title">More from Canoeing Ireland</h2>
        <ul className="plain-list">
          <li>
            <ExternalLink href={awardLinks.scheme.url}>{awardLinks.scheme.label}</ExternalLink>
          </li>
          <li>
            <ExternalLink href={awardLinks.overview.url}>{awardLinks.overview.label}</ExternalLink>: it mentions a Sea Kayak Club Leader pathway and an instructor scheme as options after
            Level 3, and gives no date or launch details for them.
          </li>
          <li>
            <ExternalLink href={awardLinks.home.url}>{awardLinks.home.label}</ExternalLink>
          </li>
        </ul>
        <p className="muted">
          The leader and rescue documents elsewhere in this app are British Canoeing’s, and the supplied sources do not say how they compare with these levels. See the{' '}
          <Link to="/training/guidance">training guidance</Link>.
        </p>
      </section>
      <SourceList ids={['ci-awards', 'ecskc-safety']} />
    </div>
  );
}
