/**
 * The Emergency card's teaching lines, in one place so the card and the assistant's library say the same thing.
 * The numbers and channel come from the club's configuration (src/clubs/<club>/club.json), not from here.
 */
export const rescuePriorities: { title: string; text: string }[] = [
  {
    title: 'Self, Team, Victim, Equipment.',
    text: 'The order of priority in a rescue: yourself first, then your team, then the casualty, then kit.',
  },
  {
    title: 'Shout, Reach, Throw, Row, Go.',
    text: 'From lowest risk to highest. Use the lowest-risk option that will work.',
  },
  {
    title: 'Assess, consider options, raise the alarm, stabilise, execute the plan.',
    text: 'The emergency sequence in the Sea Kayak Leader assessment guidance.',
  },
];

export const knowBeforeLaunch =
  'Where is the nearest phone, help, vehicle, first-aid kit and repair kit, and what spares does the group have?';

export const emergencyNotIncluded =
  'What to tell the Coast Guard when you call (position, number of people, condition of the casualty and so on) is common practice but is not in any document supplied to this project, so it is left out until the club approves wording for it.';
