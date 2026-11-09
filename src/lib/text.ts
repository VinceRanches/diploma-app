/**
 * Greek text folding, used wherever two pieces of official text must be compared as "the same text":
 * the duplicate guard in the question bank and the content key that keeps one quiz from asking the
 * same thing twice. Folds diacritics and final sigma (ς → σ) and drops everything that is not a
 * letter or a digit, so «ΝΤΟΜΆΤΑΣ» and «ντομάτας» both fold to `ντοματασ`.
 */
export const foldGreek = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')
    .toLowerCase()
    .replace(/ς/g, 'σ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
