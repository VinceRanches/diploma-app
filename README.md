# Δίπλωμα: Greek driving theory study app

An offline Android app for the Greek category B theory exam (θεωρητική εξέταση). It has road-sign lessons from the official book, practice tests, and a mock exam that works like the exam room. The interface is in Greek.

Built with React 19, TypeScript and Vite, and packaged for Android with Capacitor.

## Features

- **Τεστ**: official exam questions only (ΕΡΩΤΗΜΑΤΟΛΟΓΙΟ 1, 845 questions with the exam's own pictures).
  - **Mock exam**: works like the exam room.
    - One random question from each of the 30 official groups.
    - 35 minutes, and you pass with at most 1 mistake.
    - An answer is final once tapped, and skipped questions come back at the end.
    - The result lists all 30 questions with the correct answers.
  - **Practice**: by book chapter (25 chapters), by difficulty, and «Τα λάθη μου».
- **Σήματα**: chapter 2 of the official book, with the book's own pictures, codes and full captions.
  - Swipe or use Προηγούμενο / Επόμενο to move through a section.
  - Each section ends in a test of the official questions that show its signs.
  - A test never asks about the same sign twice.
- **Οδήγηση**: 31 lessons on the car, driving technique and the Highway Code (ΚΟΚ, Ν. 5209/2025), each with a practice quiz.
- Light, dark or automatic theme, haptics, and the Android back button. Font: Manrope.

## Official data is not included

The exam questions, their pictures and the book's sign images are copyrighted material of the Ministry of Infrastructure and Transport and the Eugenides Foundation. This repository therefore contains only the code and the data pipeline.

A fresh clone builds and runs with empty data: `scripts/ensure-data.mjs` writes placeholders. The full data is built locally from the free official sources below and is not published. The Οδήγηση lessons are included.

| Data | Source |
|---|---|
| Question bank, groups, exam time | `ExerBase.mdb` from the Ministry's **TestDrive** practice program ([yme.gov.gr](https://www.yme.gov.gr/metafores/adeies-odigisis/theoritiki-exetasi-ypopsifion-odigon-meso-i-y-mstheyo): `/uploads/mstheyo/ExerBase.zip`, `/uploads/mstheyo/TestDriveV2.zip`) |
| Question pictures | `TestDriveV2.CAB` from the same program |
| Signs, figures, chapter titles | *Θεωρητική εκπαίδευση υποψηφίων οδηγών αυτοκινήτων* ([eef.edu.gr em0006.pdf](https://www.eef.edu.gr/media/ntgah40j/em0006.pdf)) |
| Pass mark | ΥΑ 50984/7947/2013, article 22: at most 1 wrong answer |

Question text and captions are kept verbatim. Pictures are only upscaled and lightly sharpened, never redrawn, cropped or recoloured.

## Build the APK

Requires Node 22+, JDK 21 (`brew install openjdk@21`) and the Android SDK (`brew install --cask android-commandlinetools`).

```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
export ANDROID_HOME="$HOME/Library/Android/sdk"
npm install
npm test
npm run apk          # → android/app/build/outputs/apk/debug/app-debug.apk
```

## Checks

- `npm test`: unit tests for the quiz engine, the exam rules, progress and navigation.
- `node tests/e2e/exam-flow.mjs <out>`: a full mock exam in the browser. It checks skipping, returning to skipped questions, locked answers and the 30-question result.
- `node tests/e2e/section-flow.mjs <out>`: the sign view's next and previous buttons, back-to-top and the floating test button. It also checks that section tests never repeat a sign.
- `node tests/e2e/plates.mjs <out>`: measures every sign card. Each card must keep its aspect ratio and each picture must fit inside its card.
- `node tests/e2e/screenshots.mjs <out>`: screenshots of every screen in light and dark mode.
- `node tests/e2e/a11y.mjs`: axe accessibility audit.

The browser checks need the official data and a running `npm run preview -- --port 4173`.

## Notes

- The official question bank is the 2009 version published with TestDrive. Questions added to the live exam since then are not included.
- The lesson fines and penalty points follow Ν. 5209/2025 and are indicative.
- This is an unofficial study aid. It is not affiliated with the Ministry and does not replace a driving school.
