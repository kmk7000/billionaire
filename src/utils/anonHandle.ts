// Generates an anonymous display name for community posts/comments.
// Per docs/SPEC.md §2.2A: auto-generated, fixed for the lifetime of the
// post/comment thread (never chosen or changed by the user).

const ADJECTIVES = ['匿名の', '覆面の', 'とある', 'ある', '名無しの'];
const FALLBACK_NOUNS = ['会社員', 'サラリーマン', 'ビジネスパーソン', '働き人', '社会人'];

export function generateAnonHandle(jobTitle?: string): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = jobTitle?.trim() || FALLBACK_NOUNS[Math.floor(Math.random() * FALLBACK_NOUNS.length)];
  return `${adjective}${noun}`;
}
