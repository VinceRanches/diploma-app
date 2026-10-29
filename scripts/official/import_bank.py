"""Imports the official category B question bank (Μ.Σ.Θ.Ε.Υ.Ο. / TestDrive ExerBase.mdb, Ministry of Transport).

Usage: python3 -I import_bank.py <pylib> <csv-dir> <picture-dir> <app-root>
  csv-dir     — mdb-export of the Quest and Answer tables (quest.csv, answer.csv)
  picture-dir — the unpacked TestDriveV2.CAB (question pictures *.jpg)
Writes src/data/bank.json and public/bank/*.webp. Text is kept verbatim; pictures are only
upscaled 2x (Lanczos) and lightly sharpened — never redrawn, cropped or recoloured.
"""
import csv
import json
import os
import re
import sys
from collections import defaultdict

sys.path.insert(0, sys.argv[1])
from PIL import Image, ImageFilter  # noqa: E402

CSV_DIR, PIC_DIR, APP = sys.argv[2], sys.argv[3], sys.argv[4]
OUT_IMG = os.path.join(APP, 'public', 'bank')
CAR_QUESTIONNAIRE = '1'  # Kateg 1 = ΕΡΩΤΗΜΑΤΟΛΟΓΙΟ 1 (αυτοκίνητα, κατηγορία Β)
GREEK = '1'

# Book chapter titles (Ερωτηματολόγιο of «Θεωρητική εκπαίδευση υποψηφίων οδηγών αυτοκινήτων»), in book order.
CHAPTERS = [
    ('ΟΡΓΑΝΑ', 'Τα κύρια όργανα του οχήματος και τα χειριστήρια'),
    ('ΟΔΗΓΟΣ', 'Η εγκατάσταση στη θέση του οδηγού'),
    ('ΣΗΜΑΝΣΗ', 'Η σήμανση'),
    ('ΔΙΑΣΤΑΥΡΩΣΕΙΣ', 'Οι διασταυρώσεις'),
    ('ΤΑΧΥΤΗΤΑ', 'Η ταχύτητα'),
    ('ΟΔΟΣΤΡΩΜΑ', 'Η θέση στο οδόστρωμα'),
    ('ΠΡΟΣΠΕΡΑΣΗ', 'Διασταυρώνεστε, προσπερνάτε, σας προσπερνούν'),
    ('ΣΤΡΟΦΕΣ', 'Οι στροφές'),
    ('ΣΥΝΥΠΑΡΞΗ', 'Η συνύπαρξη με τους άλλους χρήστες της οδού'),
    ('ΔΙΑΔΡΟΜΗ', 'Ακολουθώντας μια διαδρομή'),
    ('ΑΛΚΟΟΛ', 'Το αλκοόλ και άλλες χημικές ουσίες, φάρμακα'),
    ('ΕΙΣΟΔΟΣ', 'Η είσοδος στην κυκλοφορία'),
    ('ΑΥΤΟΚΙΝΗΤΟΔΡΟΜΟΣ', 'Ο αυτοκινητόδρομος'),
    ('ΟΡΑΤΟΤΗΤΑ', 'Η οδήγηση με περιορισμένη ορατότητα'),
    ('ΠΡΟΣΦΥΣΗ', 'Οδηγώντας με μειωμένη πρόσφυση'),
    ('ΒΟΥΝΟ', 'Οδήγηση σε βουνό'),
    ('ΚΟΥΡΑΣΗ', 'Η κούραση και η ετοιμότητα'),
    ('ΑΤΥΧΗΜΑ', 'Η συμπεριφορά σε ατύχημα'),
    ('ΣΥΝΤΗΡΗΣΗ', 'Συντήρηση και επισκευή'),
    ('ΕΚΤΑΚΤΑ', 'Οι έκτακτες καταστάσεις'),
    ('ΚΑΝΟΝΕΣ', 'Οι διοικητικοί κανόνες'),
    ('ΣΤΑΣΗ', 'Στάση και στάθμευση'),
    ('ΑΠΟΣΤΑΣΕΙΣ', 'Αποστάσεις ασφαλείας'),
    ('ΠΕΡΙΒΑΛΛΟΝ', 'Το περιβάλλον'),
    ('ΟΙΚΟΛΟΓΙΑ', 'Οικονομική και οικολογική οδήγηση'),
]
TITLE = dict(CHAPTERS)


def clean(text):
    return re.sub(r'\s+', ' ', text or '').strip()


def enhance(src, dst):
    im = Image.open(src)
    if im.mode in ('RGBA', 'LA', 'P'):
        im = im.convert('RGBA')
        bg = Image.new('RGBA', im.size, (255, 255, 255, 255))
        im = Image.alpha_composite(bg, im)
    im = im.convert('RGB')
    w, h = im.size
    if max(w, h) < 700:
        im = im.resize((w * 2, h * 2), Image.LANCZOS)
    im = im.filter(ImageFilter.UnsharpMask(radius=1.6, percent=55, threshold=2))
    im.save(dst, 'WEBP', quality=88, method=6)
    return im.size


def main():
    quests = [q for q in csv.DictReader(open(os.path.join(CSV_DIR, 'quest.csv'), encoding='utf-8'))
              if q['QKateg'] == CAR_QUESTIONNAIRE and q['QLang'] == GREEK]
    answers = defaultdict(list)
    for a in csv.DictReader(open(os.path.join(CSV_DIR, 'answer.csv'), encoding='utf-8')):
        answers[a['AQCod']].append(a)
    pictures = {os.path.splitext(f)[0].lower(): f for f in os.listdir(PIC_DIR)
                if f.lower().endswith(('.jpg', '.jpeg', '.gif', '.png'))}

    os.makedirs(OUT_IMG, exist_ok=True)
    done_images, bank, problems = {}, [], []
    for q in quests:
        opts = sorted(answers[q['QCod']], key=lambda a: int(a['AAA']))
        options = [clean(a['ALect']) for a in opts]
        correct = [i for i, a in enumerate(opts) if a['ACorr'] == '1']
        book = clean(q['QBook'])
        m = re.match(r'^(.*?)\s*(\d+)$', book)
        key = clean(m.group(1) if m else book).replace('ΕΚΤΑΚΤΑ Α', 'ΕΚΤΑΚΤΑ')
        number = int(m.group(2)) if m else None
        if len(options) < 2 or len(correct) != 1 or len(set(options)) != len(options) or key not in TITLE:
            problems.append((q['QCod'], book, len(options), correct))
            continue
        image = None
        code = q['QPhoto'].strip()
        if code and code != '0':
            src = pictures.get(code.lower())
            if not src:
                problems.append((q['QCod'], 'missing picture', code))
                continue
            name = re.sub(r'[^A-Za-z0-9_-]', '', code) + '.webp'
            if name not in done_images:
                done_images[name] = enhance(os.path.join(PIC_DIR, src), os.path.join(OUT_IMG, name))
            image = f'bank/{name}'
        bank.append({
            'id': f"b{q['QCod']}",
            'group': int(q['QPag']),
            'chapter': key,
            'number': number,
            'q': clean(q['QLect']),
            'options': options,
            'answer': correct[0],
            'image': image,
        })

    order = {k: i for i, (k, _) in enumerate(CHAPTERS)}
    bank.sort(key=lambda b: (order[b['chapter']], b['number'] or 0))
    chapters = [{'id': k, 'title': t, 'count': sum(1 for b in bank if b['chapter'] == k)} for k, t in CHAPTERS]
    chapters = [c for c in chapters if c['count']]
    data = os.path.join(APP, 'src', 'data')
    json.dump(bank, open(os.path.join(data, 'bank.json'), 'w', encoding='utf-8'), ensure_ascii=False)
    json.dump(chapters, open(os.path.join(data, 'chapters.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    groups = sorted({b['group'] for b in bank})
    print(f'✓ {len(bank)} official questions, {len(done_images)} pictures, {len(chapters)} chapters, groups {groups[0]}..{groups[-1]} ({len(groups)})')
    print(f'  with picture: {sum(1 for b in bank if b["image"])}; 2 options: {sum(1 for b in bank if len(b["options"]) == 2)}; 3 options: {sum(1 for b in bank if len(b["options"]) == 3)}')
    if problems:
        print(f'! skipped {len(problems)}:', problems[:10])


main()
