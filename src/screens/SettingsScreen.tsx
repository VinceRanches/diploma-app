import { useState } from 'react'
import { flushSync } from 'react-dom'
import { Icon } from '../components/ui/Icon'
import { Segmented } from '../components/ui/Segmented'
import { Screen } from '../components/ui/Screen'
import { ConfirmSheet } from '../components/ui/Sheet'
import { LESSONS, SECTIONS, SIGNS } from '../data'
import { useProgress } from '../hooks/useProgress'
import { useTheme } from '../hooks/useTheme'
import type { ThemePref } from '../lib/theme'

const THEME_OPTIONS = [
  { value: 'light', label: 'Φωτεινό', icon: 'sun' },
  { value: 'dark', label: 'Σκοτεινό', icon: 'moon' },
  { value: 'auto', label: 'Αυτόματο', icon: 'auto' },
] as const

type ViewTransitionDocument = Document & { startViewTransition?: (update: () => void) => unknown }

export function SettingsScreen() {
  const { pref, resolved, setPref } = useTheme()
  const { progress, reset } = useProgress()
  const [isConfirming, setIsConfirming] = useState(false)

  // Cross-fade the whole UI between themes where the WebView supports View Transitions.
  const handleTheme = (next: ThemePref) => {
    const doc = document as ViewTransitionDocument
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (doc.startViewTransition && !reduceMotion) doc.startViewTransition(() => flushSync(() => setPref(next)))
    else setPref(next)
  }

  const handleReset = () => {
    reset()
    setIsConfirming(false)
  }

  const autoNote = `Ακολουθεί τη συσκευή — τώρα: ${resolved === 'dark' ? 'σκοτεινό' : 'φωτεινό'}.`

  return (
    <Screen title="Ρυθμίσεις">
      <div className="stagger">
        <section className="settings-card surface" aria-labelledby="appearance-title">
          <h2 className="settings-card__title" id="appearance-title">
            Εμφάνιση
          </h2>
          <Segmented options={THEME_OPTIONS} value={pref} onChange={handleTheme} ariaLabel="Θέμα εμφάνισης" />
          <p className="settings-card__note">{pref === 'auto' ? autoNote : 'Το θέμα μένει σταθερό ό,τι κι αν δείχνει η συσκευή.'}</p>
        </section>

        <section className="settings-card surface" aria-labelledby="progress-title">
          <h2 className="settings-card__title" id="progress-title">
            Πρόοδος
          </h2>
          <dl className="kv">
            <div>
              <dt>Σήματα που μελετήθηκαν</dt>
              <dd>
                {progress.signsStudied.length}/{SIGNS.length}
              </dd>
            </div>
            <div>
              <dt>Ενότητες με τεστ</dt>
              <dd>
                {Object.keys(progress.sectionBest).length}/{SECTIONS.length}
              </dd>
            </div>
            <div>
              <dt>Μαθήματα οδήγησης</dt>
              <dd>
                {progress.lessonsRead.length}/{LESSONS.length}
              </dd>
            </div>
            <div>
              <dt>Προσομοιώσεις</dt>
              <dd>{progress.exams.length}</dd>
            </div>
          </dl>
          <button type="button" className="btn btn--glass btn--danger btn--block" onClick={() => setIsConfirming(true)}>
            <Icon name="trash" size={18} /> Μηδενισμός προόδου
          </button>
        </section>

        <section className="settings-card surface" aria-labelledby="about-title">
          <h2 className="settings-card__title" id="about-title">
            Σχετικά
          </h2>
          <p className="settings-card__text selectable">
            Οι ερωτήσεις των τεστ είναι αποκλειστικά οι επίσημες ερωτήσεις του Ερωτηματολογίου 1 (κατηγορία Β), από τη βάση του προγράμματος
            εξάσκησης TestDrive του Υπουργείου Μεταφορών, με τις επίσημες εικόνες τους. Τα σήματα, οι εικόνες και οι περιγραφές τους
            προέρχονται από το επίσημο βιβλίο «Θεωρητική εκπαίδευση υποψηφίων οδηγών αυτοκινήτων». Οι εικόνες έχουν μόνο μεγεθυνθεί για
            καθαρότητα.
          </p>
          <p className="settings-card__text settings-card__text--muted">
            Ανεπίσημη εφαρμογή μελέτης για προσωπική χρήση. Δεν αντικαθιστά τη σχολή οδηγών ούτε το επίσημο υλικό του Υπουργείου.
          </p>
          <p className="settings-card__version">Δίπλωμα · έκδοση 1.4</p>
        </section>
      </div>

      <ConfirmSheet
        isOpen={isConfirming}
        title="Μηδενισμός προόδου;"
        message="Θα διαγραφούν οι βαθμολογίες, τα λάθη και το ιστορικό εξετάσεων. Δεν αναιρείται."
        confirmLabel="Μηδενισμός"
        cancelLabel="Άκυρο"
        isDestructive
        onConfirm={handleReset}
        onCancel={() => setIsConfirming(false)}
      />
    </Screen>
  )
}
