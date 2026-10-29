"""Compares pictures to (1) group exam-bank questions that show the same sign and (2) link bank questions to the
book sign they picture.

Usage: python3 -I match_pictures.py <pylib> <app-root> [--sheet <out.png>]
Writes scripts/official/picture-links.json:
  {"groups": {bankId: groupId}, "signs": {bankId: {"code": signCode, "distance": d}}}
Two questions are in the same group when their pictures match the same book sign.
Pictures are compared after trimming white margins and scaling to 32x32 (mean absolute RGB difference, 0..1).
"""
import json
import os
import sys

sys.path.insert(0, sys.argv[1])
import numpy as np  # noqa: E402
from PIL import Image, ImageDraw, ImageFont  # noqa: E402

APP = sys.argv[2]
SHEET = sys.argv[sys.argv.index('--sheet') + 1] if '--sheet' in sys.argv else None
SIZE = 32
SAME_SIGN = 0.11       # a bank picture and the book picture of the same sign
MARGIN = 0.8           # best match must beat the runner-up (another sign) by this ratio


def vector(path: str) -> np.ndarray:
    im = Image.open(path).convert('RGB')
    gray = np.asarray(im.convert('L'))
    ys, xs = np.where(gray < 235)
    if len(xs):
        im = im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    side = max(im.size)
    square = Image.new('RGB', (side, side), (255, 255, 255))
    square.paste(im, ((side - im.width) // 2, (side - im.height) // 2))
    return np.asarray(square.resize((SIZE, SIZE), Image.LANCZOS), dtype=np.float32).reshape(-1) / 255.0


def distances(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    return np.abs(a[:, None, :] - b[None, :, :]).mean(axis=2)


def main() -> None:
    bank = [b for b in json.load(open(os.path.join(APP, 'src/data/bank.json'), encoding='utf-8')) if b.get('image')]
    book = json.load(open(os.path.join(APP, 'scripts/official/book-signs.json'), encoding='utf-8'))
    signs = [s for s in book if s['kind'] == 'sign']

    bank_vec = np.stack([vector(os.path.join(APP, 'public', b['image'])) for b in bank])
    sign_vec = np.stack([vector(os.path.join(APP, 'public', s['image'])) for s in signs])

    # 2. Bank picture → book sign.
    d_sign = distances(bank_vec, sign_vec)
    links = {}
    for i, b in enumerate(bank):
        order = np.argsort(d_sign[i])
        best = order[0]
        runner = next((k for k in order[1:] if signs[k]['code'] != signs[best]['code']), None)
        d1 = float(d_sign[i, best])
        d2 = float(d_sign[i, runner]) if runner is not None else 1.0
        if d1 < SAME_SIGN and d1 < MARGIN * d2:
            links[b['id']] = {'code': signs[best]['code'], 'distance': round(d1, 4)}

    # Questions whose pictures match the same book sign show the same sign.
    groups = {}
    for bid, link in links.items():
        groups.setdefault(link['code'], []).append(bid)
    multi = [ids for ids in groups.values() if len(ids) > 1]
    group_of = {bid: f"sign:{code}" for code, ids in groups.items() if len(ids) > 1 for bid in ids}

    out = os.path.join(APP, 'scripts/official/picture-links.json')
    json.dump({'groups': group_of, 'signs': links}, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'✓ {len(bank)} bank pictures: {len(multi)} groups of the same sign ({sum(map(len, multi))} questions); '
          f'{len(links)} pictures linked to a book sign')

    if SHEET:
        write_sheet(bank, signs, links, multi)


def write_sheet(bank, signs, links, multi) -> None:
    font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', 13)
    by_id = {b['id']: b for b in bank}
    sign_img = {s['code']: s['image'] for s in signs}
    rows = [(bid, [by_id[bid]['image'], sign_img[l['code']]], f"{bid} → {l['code']} ({l['distance']})") for bid, l in links.items()]
    rows += [(ids[0], [by_id[i]['image'] for i in ids[:4]], 'same: ' + ' '.join(ids)) for ids in multi]
    cell, cols, per_page = 110, 5, 50
    per_row = 2
    for page in range(0, len(rows), per_page):
        chunk = rows[page:page + per_page]
        width = cols * (cell * per_row + 16)
        height = ((len(chunk) + cols - 1) // cols) * (cell + 20)
        sheet = Image.new('RGB', (width, height), (235, 235, 240))
        draw = ImageDraw.Draw(sheet)
        for n, (_, images, label) in enumerate(chunk):
            x0 = (n % cols) * (cell * per_row + 16)
            y0 = (n // cols) * (cell + 20)
            for k, rel in enumerate(images[:per_row]):
                im = Image.open(os.path.join(APP, 'public', rel)).convert('RGB')
                im.thumbnail((cell - 6, cell - 6))
                sheet.paste(im, (x0 + k * cell + 3, y0 + 3))
            draw.text((x0 + 2, y0 + cell + 2), label[:36], fill=(0, 0, 0), font=font)
        sheet.save(SHEET.replace('.png', f'-{page // per_page}.png'))


main()
