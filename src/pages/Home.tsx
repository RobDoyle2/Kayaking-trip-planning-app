import { CoastalArt } from '../components/CoastalArt';
import { SectionCard } from '../components/SectionCard';
import { Notice } from '../components/ui';
import { club } from '../clubs';
import { sectionsForClub, type Section } from '../content/sections';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { Link } from '../router/Router';

/**
 * The first screen: the club, then one big button for each section in club.homeSections, then a short caution at the bottom.
 * Everything else (VHF, Navigation and Tides, the Knowledge Centre, the Emergency card) is reached from those buttons or the menu.
 */
export function Home() {
  useDocumentTitle();
  const byId = sectionsForClub(club.enabledSections);
  const big = club.homeSections.map((id) => byId.find((s) => s.id === id)).filter((s): s is Section => s !== undefined);

  return (
    <>
      <section className="hero hero--home" aria-labelledby="home-title">
        <CoastalArt />
        <div className="container hero__grid">
          <div className="hero__copy">
            <p className="eyebrow">{club.name}</p>
            <h1 id="home-title">{club.appName}</h1>
            <p className="lead">{club.tagline}</p>
          </div>

          <div className="hero__logo">
            <img src={club.logo.src} alt={club.logo.alt} width={club.logo.width} height={club.logo.height} />
          </div>
        </div>
      </section>

      <section className="container block block--home" aria-labelledby="sections-title">
        <h2 id="sections-title" className="sr-only">
          Sections
        </h2>
        <ul className="card-grid card-grid--home">
          {big.map((section) => (
            <li key={section.id}>
              <SectionCard section={section} compact />
            </li>
          ))}
        </ul>
      </section>

      <section className="container block block--tight-end">
        <div className="notice-small">
          <Notice title="Preview: not yet approved by the club">
            Everything here is a preview until the ECSKC committee approves it. See <Link to="/sources">Sources and limits</Link>.
          </Notice>
        </div>
      </section>
    </>
  );
}
