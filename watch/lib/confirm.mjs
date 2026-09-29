// Some upstream changes must be seen on two checks in a row before they are published. The live
// model catalog has served two versions of the same instructions in alternation (2026-09-28:
// GPT-6 Sol's base instructions flipped five times in six hours), and publishing every flip turns
// the site and the changelog into noise. A target says which changes need confirming; app and
// binary changes never do.
//
//   key          this check's fingerprint (JSON string)
//   published    the fingerprint last published
//   pending      a change seen once and not yet confirmed
//   needsConfirm whether this change has to be confirmed
//
// Returns { run, pending, flippedBack }: run the refresh now or not, the pending value to keep,
// and whether upstream went back to the published version after a change was seen (two versions
// being served).
export function confirmChange({ key, published, pending = null, needsConfirm = false }) {
  if (key === published) return { run: false, pending: null, flippedBack: pending != null };
  if (!needsConfirm || pending === key) return { run: true, pending: null, flippedBack: false };
  return { run: false, pending: key, flippedBack: false };
}
