export function createSermonDiscussionLocalIdFactory(
  now: () => number = Date.now
) {
  let sequence = 0;

  return (prefix: "question" | "action") => {
    sequence += 1;
    return `${prefix}_${now()}_${sequence}`;
  };
}
