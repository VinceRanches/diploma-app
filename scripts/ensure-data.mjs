#!/usr/bin/env node
// The official exam bank and the book's signs are copyrighted, so they are not in the repository.
// Until they are built locally (see README → Official data), this writes empty placeholders so the app
// still compiles and runs. Existing data is never touched.
import { existsSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DATA_DIR = join(resolve(dirname(fileURLToPath(import.meta.url)), '..'), 'src/data')
const GENERATED = ['bank.json', 'chapters.json', 'sections.json', 'signs.json']

const missing = GENERATED.filter((file) => !existsSync(join(DATA_DIR, file)))
for (const file of missing) writeFileSync(join(DATA_DIR, file), '[]\n')
if (missing.length) console.log(`No official data yet: wrote empty ${missing.join(', ')} (see README → Official data).`)
