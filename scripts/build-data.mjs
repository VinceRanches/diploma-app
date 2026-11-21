#!/usr/bin/env node
// Builds the app data (Greek only) from official sources:
//   scripts/official/book-signs.json  — signs and figures extracted from the official book (extract_book_signs.py)
//   src/data/bank.json                 — the official exam question bank (import_bank.py)
//   <research-dir>/out                 — explanations, look-alike lists and Part 2 lessons
// Usage: node scripts/build-data.mjs <research-dir>
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const RESEARCH = process.argv[2]
if (!RESEARCH) {
  console.error('usage: node scripts/build-data.mjs <research-dir>')
  process.exit(1)
}
const OUT = join(RESEARCH, 'out')
const DATA_DIR = join(ROOT, 'src/data')

const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'))
const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim()
const el = (value) => clean(typeof value === 'string' ? value : value?.el)
const codeNumber = (code) => Number.parseInt(code.split('-')[1] ?? '', 10)
const figureNumber = (code) => {
  const m = code.match(/(\d+)\.(\d+)/)
  return m ? Number(m[1]) * 100 + Number(m[2]) : 0
}
const norm = (text) =>
  clean(text)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-zα-ω0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
const warnings = []

/* ---------- Sections, in the order of the official book (κεφ. 2 «Η σήμανση και η σηματοδότηση») ---------- */

const inFigures = (code, ranges) => ranges.some(([a, b]) => figureNumber(code) >= a && figureNumber(code) <= b)

const SECTIONS = [
  { id: 'kindynou', title: 'Πινακίδες κινδύνου', group: 'danger', match: (s) => s.code.startsWith('Κ-') },
  { id: 'proteraiotitas', title: 'Πινακίδες προτεραιότητας', group: 'priority', match: (s) => s.code.startsWith('Ρ-') && s.group === 'priority' },
  { id: 'apagoreyseis', title: 'Απαγορεύσεις και περιορισμοί', group: 'prohibitory', match: (s) => s.code.startsWith('Ρ-') && s.group === 'prohibitory' },
  { id: 'ypochreoseis', title: 'Πινακίδες υποχρεώσεων', group: 'mandatory', match: (s) => s.code.startsWith('Ρ-') && s.group === 'mandatory' },
  { id: 'pliroforiakes', title: 'Πληροφοριακές πινακίδες', group: 'informative', match: (s) => s.code.startsWith('Π-') && codeNumber(s.code) < 80 },
  { id: 'aftokinitodromos', title: 'Πινακίδες αυτοκινητοδρόμου', group: 'informative', match: (s) => s.code.startsWith('Π-') && codeNumber(s.code) >= 80 },
  { id: 'prosthetes', title: 'Πρόσθετες πινακίδες', group: 'supplementary', match: (s) => s.code.startsWith('Πρ-') },
  { id: 'diagrammiseis', title: 'Οριζόντια σήμανση', group: 'marking', match: (s) => s.kind === 'figure' && inFigures(s.code, [[201, 219]]) },
  { id: 'fotoeini', title: 'Φωτεινή σηματοδότηση', group: 'signal', match: (s) => s.kind === 'figure' && inFigures(s.code, [[220, 226], [324, 328]]) },
  { id: 'trochonomos', title: 'Σήματα τροχονόμου', group: 'police', match: (s) => s.kind === 'figure' && inFigures(s.code, [[329, 335]]) },
]

/* ---------- Research extras keyed by sign code (explanations, look-alikes, Ρ sub-group) ---------- */

const research = new Map(
  ['K', 'R', 'P']
    .flatMap((key) => (existsSync(join(OUT, `signs-${key}.json`)) ? readJson(join(OUT, `signs-${key}.json`)) : []))
    .map((s) => [clean(s.code), s]),
)

/* ---------- Signs from the official book ---------- */

const book = readJson(join(ROOT, 'scripts/official/book-signs.json'))
const signs = book.flatMap((entry) => {
  const code = clean(entry.code)
  const extra = research.get(code)
  const kind = entry.kind === 'figure' ? 'figure' : 'sign'
  const group = kind === 'figure' ? 'other' : code.startsWith('Ρ-') ? (extra?.group ?? 'prohibitory') : 'other'
  const base = { code, kind, group }
  const section = SECTIONS.find((s) => s.match(base))
  if (!section) {
    warnings.push(`${code}: no section (dropped)`)
    return []
  }
  const name = clean(entry.name)
  if (!name) {
    warnings.push(`${code}: empty name (dropped)`)
    return []
  }
  return [
    {
      code,
      label: clean(entry.label ?? code),
      kind,
      slug: entry.image.replace(/^book\//, '').replace(/\.webp$/, ''),
      group: section.group,
      sectionId: section.id,
      name,
      shape: kind === 'figure' ? 'photo' : clean(extra?.shape) || 'other',
      image: entry.image,
      page: entry.page,
      similar: (extra?.similar ?? []).map(clean),
    },
  ]
})

const order = (s) => {
  const sectionIndex = SECTIONS.findIndex((x) => x.id === s.sectionId)
  const n = s.kind === 'figure' ? figureNumber(s.code) : codeNumber(s.code)
  return sectionIndex * 100000 + n * 10 + (s.code.match(/[α-ω]+$/)?.[0]?.charCodeAt(0) ?? 0) / 1000
}
signs.sort((a, b) => order(a) - order(b))
const codes = new Set(signs.map((s) => s.code))
const finalSigns = signs.map((s) => ({ ...s, similar: s.similar.filter((c) => c !== s.code && codes.has(c)) }))

const sections = SECTIONS.map(({ match, ...meta }) => {
  const list = finalSigns.filter((s) => s.sectionId === meta.id)
  const pages = list.map((s) => s.page)
  return {
    ...meta,
    subtitle: list.length ? `Από το επίσημο βιβλίο, σελ. ${Math.min(...pages)}–${Math.max(...pages)}.` : '',
    codes: list.map((s) => s.code),
  }
}).filter((s) => s.codes.length > 0)

/* ---------- Drop questions the bank holds twice ---------- */

/**
 * When the Ministry refreshes a question's wording it keeps the old revision on an extra page of the
 * questionnaire (QPag 200/201, outside the 30 group pages the exam draws from), so the same chapter
 * number ends up on two rows with the same picture and the same answer. The row on a real group page is
 * the current one: «ΣΗΜΑΝΣΗ 97» kept «…σιδηροδρομικός συρμός» on page 201 and «…συρμός ή τροχιόδρομος»
 * in group 7.
 *
 * A chapter numbers each of its questions once, so that number is the only evidence strong enough to
 * delete a row. Sharing a stem, or even a stem and a picture, is not: ΔΙΑΣΤΑΥΡΩΣΕΙΣ 9 and 10 both ask
 * «Σε μια κυκλική διασταύρωση:» over the same drawing and have different answers, and ΑΛΚΟΟΛ 24, 30 and
 * 33 all read «Η κατανάλωση αλκοόλ μπορεί να προκαλέσει κατά την οδήγηση:». Those stay in the bank;
 * keeping them out of one another's tests is `sameQuestionKeys` in src/lib/quiz.ts, which costs nothing.
 */
const EXAM_PAGES = 30
const current = (a, b) => (a.group <= EXAM_PAGES) !== (b.group <= EXAM_PAGES) ? (a.group <= EXAM_PAGES ? -1 : 1) : b.id.localeCompare(a.id, 'en', { numeric: true })

function dropDuplicates(questions) {
  const taken = new Map()
  const kept = new Set()
  for (const q of [...questions].sort(current)) {
    if (q.number === null) {
      kept.add(q.id)
      continue
    }
    const key = `${q.chapter}#${q.number}`
    const clash = taken.get(key)
    if (clash) {
      warnings.push(`${q.id} (ομάδα ${q.group}, ${q.chapter} ${q.number}): duplicate of ${clash.id} (ομάδα ${clash.group}) — dropped`)
      continue
    }
    taken.set(key, q)
    kept.add(q.id)
  }
  return questions.filter((q) => kept.has(q.id))
}

/**
 * The export ships one drawing under several names — bank/D009.webp and bank/D010.webp are the same
 * bytes — so «Σε μια κυκλική διασταύρωση:» looks like two different pictures to anything that compares
 * the path. Point every question at the first name its picture has, leaving the extra files in place.
 */
function oneNamePerPicture(questions) {
  const canonical = new Map()
  for (const image of [...new Set(questions.map((q) => q.image).filter(Boolean))].sort()) {
    const file = join(ROOT, 'public', image)
    if (!existsSync(file)) {
      warnings.push(`${image}: picture file missing`)
      continue
    }
    const digest = createHash('sha256').update(readFileSync(file)).digest('hex')
    canonical.set(image, canonical.get(digest) ?? image)
    if (!canonical.has(digest)) canonical.set(digest, image)
  }
  return questions.map((q) => (q.image && canonical.get(q.image) !== q.image ? { ...q, image: canonical.get(q.image) } : q))
}

/* ---------- Link official questions to sign sections ---------- */

const bankFile = join(DATA_DIR, 'bank.json')
const bank = dropDuplicates(oneNamePerPicture(readJson(bankFile)))
const tokens = (text) => new Set(text.split(' ').filter((w) => w.length >= 3))
const jaccard = (a, b) => {
  const inter = [...a].filter((w) => b.has(w)).length
  return inter / (a.size + b.size - inter || 1)
}
const byName = finalSigns
  .filter((s) => s.kind === 'sign')
  .map((s) => ({ key: norm(s.name), words: tokens(norm(s.name)), sectionId: s.sectionId }))

// Picture matches (scripts/official/match_pictures.py): the sign a question shows, and questions showing the same sign.
const pictureLinks = existsSync(join(ROOT, 'scripts/official/picture-links.json'))
  ? readJson(join(ROOT, 'scripts/official/picture-links.json'))
  : { groups: {}, signs: {} }
const signByCode = new Map(finalSigns.map((s) => [s.code, s]))

function sectionFor(q) {
  const pictured = signByCode.get(pictureLinks.signs[q.id]?.code)
  if (pictured) return pictured.sectionId
  const answer = norm(q.options[q.answer])
  const exact = byName.find((s) => s.key === answer)
  if (exact) return exact.sectionId
  const partial = byName
    .filter((s) => answer.length >= 14 && s.key.length >= 14 && (s.key.startsWith(answer) || answer.startsWith(s.key)))
    .sort((a, b) => b.key.length - a.key.length)[0]
  if (partial) return partial.sectionId
  if (q.chapter !== 'ΣΗΜΑΝΣΗ' && q.chapter !== 'ΔΙΑΣΤΑΥΡΩΣΕΙΣ') return undefined
  const words = tokens(answer)
  const similar = byName
    .map((s) => ({ s, score: jaccard(words, s.words) }))
    .sort((a, b) => b.score - a.score)[0]
  if (similar && similar.score >= 0.6 && words.size >= 3) return similar.s.sectionId
  const text = norm(`${q.q} ${q.options.join(' ')}`)
  if (/τροχονομ|αστυνομικ/.test(text)) return 'trochonomos'
  if (/σηματοδοτ|φωτειν|φαναρ|(κοκκινο|πρασινο|κιτρινο|πορτοκαλι) (φως|βελος)/.test(text)) return 'fotoeini'
  if (q.chapter === 'ΣΗΜΑΝΣΗ' && /γραμμ|διαγραμμισ|οδοστρωμα|βελη|ζιγκ/.test(text)) return 'diagrammiseis'
  return undefined
}

const linkedBank = bank.map(({ sectionId: _old, dup: _oldDup, ...q }) => {
  const sectionId = sectionFor(q)
  const dup = pictureLinks.groups[q.id]
  return { ...q, ...(sectionId ? { sectionId } : {}), ...(dup ? { dup } : {}) }
})


/* ---------- Part 2 lessons (research, fact-checked) ---------- */

const usedQuizIds = new Set()
const lessons = ['car', 'driving', 'rules'].flatMap((module) =>
  readJson(join(OUT, `lessons-${module}.json`)).map((l) => ({
    id: clean(l.id),
    module,
    title: el(l.title),
    icon: clean(l.icon) || 'book',
    summary: el(l.summary),
    sections: (l.sections ?? []).map((s) => ({
      heading: el(s.heading),
      body: el(s.body),
      ...(s.bullets?.length ? { bullets: s.bullets.map(el).filter(Boolean) } : {}),
      ...(el(s.tip) ? { tip: el(s.tip) } : {}),
    })),
    quiz: (l.quiz ?? []).flatMap((q) => {
      const options = (q.options ?? []).map(el)
      let id = clean(q.id) || `${l.id}-q`
      while (usedQuizIds.has(id)) id = `${id}x`
      const valid = options.length >= 2 && Number.isInteger(q.answer) && q.answer >= 0 && q.answer < options.length && new Set(options).size === options.length && el(q.q)
      if (!valid) {
        warnings.push(`lesson quiz ${id}: invalid`)
        return []
      }
      usedQuizIds.add(id)
      return [{ id, q: el(q.q), options, answer: q.answer, explain: el(q.explain), difficulty: [1, 2, 3].includes(q.difficulty) ? q.difficulty : 2 }]
    }),
  })),
)

/* ---------- Write ---------- */

// The chapter counts are printed on the tests screen, so they follow the bank that was just written —
// import_bank.py counted the rows it imported, which is a different number once a duplicate is dropped.
const chaptersFile = join(DATA_DIR, 'chapters.json')
const chapters = existsSync(chaptersFile)
  ? readJson(chaptersFile)
      .map((c) => ({ ...c, count: linkedBank.filter((q) => q.chapter === c.id).length }))
      .filter((c) => c.count > 0)
  : []

writeFileSync(join(DATA_DIR, 'signs.json'), JSON.stringify(finalSigns))
writeFileSync(join(DATA_DIR, 'sections.json'), JSON.stringify(sections, null, 1))
writeFileSync(bankFile, JSON.stringify(linkedBank))
writeFileSync(chaptersFile, JSON.stringify(chapters, null, 1))
writeFileSync(join(DATA_DIR, 'lessons.json'), JSON.stringify(lessons))

for (const s of sections) {
  const linked = linkedBank.filter((q) => q.sectionId === s.id).length
  console.log(`  ${s.title.padEnd(30)} ${String(s.codes.length).padStart(4)} από το βιβλίο · ${String(linked).padStart(3)} επίσημες ερωτήσεις`)
}
const signage = linkedBank.filter((q) => q.chapter === 'ΣΗΜΑΝΣΗ')
console.log(`✓ ${finalSigns.length} book entries, ${linkedBank.length} official questions (${signage.filter((q) => q.sectionId).length}/${signage.length} of «Η σήμανση» linked to a section), ${lessons.length} lessons`)
if (warnings.length) console.log(`! ${warnings.length} warnings:\n  ${warnings.slice(0, 30).join('\n  ')}`)
