export type SectionId = 'leadership' | 'trip-planning' | 'training' | 'navigation' | 'vhf' | 'knowledge';

/** Everything that differs from one club to the next lives in a club.json file. */
export interface ClubConfig {
  slug: string;
  name: string;
  shortName: string;
  appName: string;
  /** Short name used under the home-screen icon when the app is installed. */
  pwaShortName: string;
  tagline: string;
  website: { url: string; label: string };
  logo: { src: string; alt: string; width: number; height: number };
  theme: {
    primary: string;
    primaryDark: string;
    tint: string;
    ink: string;
    danger: string;
  };
  enabledSections: SectionId[];
  assistantName: string;
  emergency: {
    /** Numbers for an emergency call, exactly as the club words them. */
    numbers: string;
    vhfChannel: string;
    /** Where the wording above comes from. */
    source: string;
  };
}
