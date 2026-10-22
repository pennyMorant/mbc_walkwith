const missionSeparator = /\s*(?:[，,；;]|\band\b|\by\b)\s*/iu;

export function splitMissionPhrases(value: string) {
  const source = value.trim();
  if (!source) {
    return [];
  }

  const phrases = source
    .split(missionSeparator)
    .map((item) => item.trim())
    .filter(Boolean);

  return phrases.length >= 2 ? phrases : [source];
}
