"""Extracts the sign catalogue from the official book «Θεωρητική εκπαίδευση υποψηφίων οδηγών αυτοκινήτων»
(chapter 2 «Η σήμανση και η σηματοδότηση» and the traffic-police figures of chapter 3).

Usage: python3 -I extract_book_signs.py <pylib> <book.pdf> <app-root>

Signs: every caption that starts with a sign code ((Κ-1α), (Ρ-2), (Π-8δ), (Πρ-14α)…) owns the graphics drawn directly
above it. Those graphics are grown into one region, so composite signs (several pictures, vector art, text inside the
sign) come out whole. A region made of a single embedded picture keeps the book's original pixels (2x Lanczos +
light sharpening); anything else is rendered from the PDF at high resolution with the page watermark removed.
Figures (Σχ. x.y) are photos with the caption underneath and are taken as the original embedded picture.
Writes scripts/official/book-signs.json and public/book/*.webp. Text is verbatim.
"""
import io
import json
import os
import re
import sys

sys.path.insert(0, sys.argv[1])
import fitz  # noqa: E402
from PIL import Image, ImageFilter  # noqa: E402

PDF, APP = sys.argv[2], sys.argv[3]
OUT_IMG = os.path.join(APP, 'public', 'book')
SIGN_PAGES = range(29, 64)  # 0-based: printed pp. 21–54
FIGURE_PAGES = list(range(29, 64)) + list(range(70, 74))  # plus the traffic-police figures (~p. 63)
CODE_RE = re.compile(r'\(?\s*(Πρ|Pρ|Κ|K|Ρ|P|Π)\s*[-–]\s*(\d+)\s*([α-ωά-ώ]{0,2})\s*\)')
FIG_RE = re.compile(r'Σχ\.\s*(\d+)\s*\.\s*(\d+)\s*\.?')
SERIES = {'K': 'Κ', 'P': 'Ρ', 'Pρ': 'Πρ'}
SLUG_SERIES = {'Κ': 'K', 'Ρ': 'R', 'Π': 'P', 'Πρ': 'Pr'}
SLUG_SUFFIX = str.maketrans({'α': 'a', 'β': 'b', 'γ': 'g', 'δ': 'd', 'ε': 'e', 'ζ': 'z', 'η': 'h', 'θ': 'th', 'ι': 'i', 'σ': 's', 'τ': 't'})
RENDER_ZOOM = 5
SEED_GAP = 70     # pt: a sign's lowest graphic sits at most this far above its caption
MAX_HEIGHT = 260  # pt: no sign is taller than this


def fix(text):
    """The book's legacy font stores cp1253 bytes as Latin-1 glyphs."""
    try:
        return text.encode('latin-1').decode('cp1253')
    except (UnicodeEncodeError, UnicodeDecodeError):
        return ''.join(ch.encode('latin-1', 'ignore').decode('cp1253', 'ignore') or ch for ch in text)


BOOK_FONT = 'UB-Times'  # captions, headings and body text; lettering inside signs uses UB-Helvetica


def lines_of(page, book_font_only=False):
    out = []
    for block in page.get_text('dict')['blocks']:
        for line in block.get('lines', []):
            if book_font_only:
                # Body text is UB-Times; a line may still contain a letter in another font (e.g. «μορφής Υ»).
                total = sum(len(span['text'].strip()) for span in line['spans']) or 1
                body = sum(len(span['text'].strip()) for span in line['spans'] if span['font'].startswith(BOOK_FONT))
                if body < 0.6 * total:
                    continue
            text = ''.join(fix(span['text']) for span in line['spans']).strip()
            if text:
                out.append((fitz.Rect(line['bbox']), text))
    return out


def join_lines(texts):
    joined = ''
    for t in texts:
        if joined.endswith('-') and t[:1].islower():
            joined = joined[:-1] + t
        else:
            joined = (joined + ' ' + t).strip()
    return greekify(re.sub(r'\s+', ' ', joined).strip())


# Latin letters that look like Greek ones; the book's legacy fonts sometimes mix them into Greek words.
LOOKALIKE = str.maketrans({'A': 'Α', 'B': 'Β', 'E': 'Ε', 'Z': 'Ζ', 'H': 'Η', 'I': 'Ι', 'K': 'Κ', 'M': 'Μ', 'N': 'Ν',
                           'O': 'Ο', 'P': 'Ρ', 'T': 'Τ', 'Y': 'Υ', 'X': 'Χ', 'a': 'α', 'i': 'ι', 'k': 'κ', 'n': 'η',
                           'o': 'ο', 'p': 'ρ', 't': 'τ', 'u': 'υ', 'v': 'ν', 'x': 'χ', 'y': 'γ'})
LOOKALIKE_LATIN = str.maketrans({'Α': 'A', 'Β': 'B', 'Ε': 'E', 'Ζ': 'Z', 'Η': 'H', 'Ι': 'I', 'Κ': 'K', 'Μ': 'M', 'Ν': 'N',
                                 'Ο': 'O', 'Ρ': 'P', 'Τ': 'T', 'Υ': 'Y', 'Χ': 'X', 'ο': 'o'})
GREEK_LETTER = re.compile(r'[α-ωά-ώϊϋΐΰΑ-ΩΆ-Ώ]')


def greekify(text):
    """Replace Latin look-alikes inside words that are otherwise Greek (pure Latin words like «km/h» stay)."""
    def fix(m):
        word = m.group(0)
        greek, latin = len(GREEK_LETTER.findall(word)), len(re.findall(r'[A-Za-z]', word))
        if not greek or not latin:
            return word
        return word.translate(LOOKALIKE) if greek >= latin else word.translate(LOOKALIKE_LATIN)
    return re.sub(r'\S+', fix, text)


CAPTION_GAP = 5  # pt between consecutive lines of one caption; a bigger gap ends it

# The book draws these junction-shape symbols as vector art inside the caption text (p. 41), so text extraction
# reads «μορφής (π.χ. …)» with the shape missing. Transcribed from the rendered page.
DRAWN_GLYPHS = {'Πρ-8': '⊣', 'Πρ-9': '⊢', 'Πρ-10': '⊤', 'Πρ-11': '⊥', 'Πρ-13': '⅄'}


def restore_glyph(code, name):
    glyph = DRAWN_GLYPHS.get(code)
    return re.sub(r'μορφής\s*\(', f'μορφής {glyph} (', name) if glyph else name


def caption_text(code_line, rest, x0, x1, book_lines):
    """The whole caption: the text after the code plus every following line in the column, until a gap or the
    next caption starts."""
    texts, last = [rest], code_line.y1
    for lr, lt in sorted(book_lines, key=lambda x: x[0].y0):
        if lr.y0 <= code_line.y0 + 2 or min(lr.x1, x1) - max(lr.x0, x0) <= 0.5 * min(lr.width, x1 - x0):
            continue
        if lr.y0 - last > CAPTION_GAP or CODE_RE.match(lt):
            break
        texts.append(lt)
        last = lr.y1
    return join_lines(texts)


def code_of(m):
    return f'{SERIES.get(m.group(1), m.group(1))}-{m.group(2)}{m.group(3)}'


def slug_of(code):
    if code.startswith('Σχ.'):
        return 'fig-' + code.replace('Σχ.', '').strip().replace('.', '-')
    series, rest = code.split('-', 1)
    return f'{SLUG_SERIES[series]}-{rest.translate(SLUG_SUFFIX)}'


def is_watermark(rect, page):
    return rect.width * rect.height > 0.15 * page.rect.width * page.rect.height


def enhance(im):
    if im.mode in ('RGBA', 'LA', 'P'):
        im = im.convert('RGBA')
        bg = Image.new('RGBA', im.size, (255, 255, 255, 255))
        im = Image.alpha_composite(bg, im)
    im = im.convert('RGB')
    w, h = im.size
    if max(w, h) < 700:
        im = im.resize((w * 2, h * 2), Image.LANCZOS)
    return im.filter(ImageFilter.UnsharpMask(radius=1.6, percent=55, threshold=2))


def original_pixels(doc, xref):
    pix = fitz.Pixmap(doc, xref)
    smask = doc.xref_get_key(xref, 'SMask')
    if smask[0] == 'xref':
        pix = fitz.Pixmap(pix, fitz.Pixmap(doc, int(smask[1].split()[0])))
    if pix.colorspace and pix.colorspace.n == 4:
        pix = fitz.Pixmap(fitz.csRGB, pix)
    return Image.open(io.BytesIO(pix.tobytes('png')))


def rendered(page, clip):
    pix = page.get_pixmap(clip=clip, matrix=fitz.Matrix(RENDER_ZOOM, RENDER_ZOOM))
    im = Image.open(io.BytesIO(pix.tobytes('png'))).convert('RGB')
    box = im.convert('L').point(lambda v: 255 if v < 240 else 0).getbbox()
    if not box:
        return None
    pad = 14
    im = im.crop((max(0, box[0] - pad), max(0, box[1] - pad), min(im.width, box[2] + pad), min(im.height, box[3] + pad)))
    if max(im.size) > 1400:
        im.thumbnail((1400, 1400), Image.LANCZOS)
    return im


def graphics_of(page):
    """Embedded pictures (minus the watermark) and vector paths, as (rect, xref or None)."""
    area = page.rect.width * page.rect.height
    out = []
    for info in page.get_image_info(xrefs=True):
        r = fitz.Rect(info['bbox'])
        if info['xref'] and not is_watermark(r, page) and r.width > 4 and r.height > 4:
            out.append((r, info['xref']))
    for d in page.get_drawings():
        r = fitz.Rect(d['rect'])
        if r.is_empty or r.width * r.height > 0.3 * area:
            continue
        if (r.height < 1.5 and r.width > 200) or (r.width < 1.5 and r.height > 200):
            continue  # rules spanning the page
        out.append((r, None))
    return out


def in_artwork(rect, graphics):
    """True when a text line sits entirely on a picture (e.g. «(Ρ-52δ)» printed inside another sign's panel)."""
    return any(g[1] and g[0].contains(rect) for g in graphics)


def sign_region(caption, x0, x1, graphics, ceiling):
    """Grow the region of graphics sitting directly above the caption, inside its column and below the
    caption block of the sign above (ceiling)."""
    def in_column(r):
        return min(r.x1, x1) - max(r.x0, x0) > 0.25 * min(r.width, x1 - x0)

    def above(r):
        return r.y1 <= caption.y0 + 3 and r.y0 >= max(caption.y0 - MAX_HEIGHT, ceiling - 1)

    members = {i for i, (r, _) in enumerate(graphics)
               if above(r) and in_column(r) and r.y1 >= caption.y0 - SEED_GAP}
    if not members:
        return None, set()
    region = fitz.Rect(graphics[min(members)][0])
    for i in members:
        region |= graphics[i][0]
    changed = True
    while changed:
        changed = False
        grown = fitz.Rect(region.x0 - 4, region.y0 - 4, region.x1 + 4, region.y1 + 4)
        for i, (r, _) in enumerate(graphics):
            if i not in members and above(r) and in_column(r) and r.intersects(grown):
                members.add(i)
                region |= r
                changed = True
    region = fitz.Rect(max(region.x0, x0), max(region.y0, ceiling), min(region.x1, x1), min(region.y1, caption.y0 - 0.5))
    return region, members


def save(im, slug):
    im.save(os.path.join(OUT_IMG, slug + '.webp'), 'WEBP', quality=90, method=6)


def extract_signs(doc, render_doc, entries, used_slugs):
    seen = set()
    for pno in SIGN_PAGES:
        page, render_page = doc[pno], render_doc[pno]
        for info in render_page.get_image_info(xrefs=True):
            if info['xref'] and is_watermark(fitz.Rect(info['bbox']), render_page):
                render_page.delete_image(info['xref'])
        lines = lines_of(page)
        graphics = graphics_of(page)
        captions = []
        for r, t in lines:
            m = CODE_RE.match(t)
            if not m:
                continue
            codes, rest = [code_of(m)], t[m.end():]
            while (n := CODE_RE.match(rest.lstrip())):
                codes.append(code_of(n))
                rest = rest.lstrip()[n.end():]
            in_art = any(g[0].contains(r) for g in graphics)  # e.g. a code printed inside another sign's artwork
            captions.append((r, codes, rest, in_art))
        book_lines = lines_of(page, book_font_only=True)
        free_text = [(lr, lt) for lr, lt in book_lines
                     if len(lt) >= 6 and not in_artwork(lr, graphics) and not CODE_RE.fullmatch(lt.strip())]
        cells = []
        for r, codes, rest, _ in captions:
            cx = (r.x0 + r.x1) / 2
            row = [(cr.x0 + cr.x1) / 2 for cr, _, _, _ in captions if abs(cr.y0 - r.y0) < 30 and cr is not r]
            half = min([abs(cx - x) for x in row] + [2 * 150]) / 2 - 3
            x0, x1 = max(page.rect.x0 + 15, cx - half), min(page.rect.x1 - 15, cx + half)
            cells.append((r, codes, rest, x0, x1))
        for r, codes, rest, x0, x1 in cells:
            if codes[0] in seen:
                continue
            # The sign ends below the nearest free text above it in its column: a heading or the previous
            # caption. Text printed inside artwork and one-letter labels (α, β, γ around plates) don't count.
            ceiling = max([lr.y1 for lr, lt in free_text if lr.y1 <= r.y0 - 2 and min(lr.x1, x1) - max(lr.x0, x0) > 0]
                          + [page.rect.y0])
            region, members = sign_region(r, x0, x1, graphics, ceiling)
            if region is None or region.is_empty:
                print(f'   ! {codes[0]} (p.{pno - 8}): no graphics above the caption')
                continue
            name = restore_glyph(codes[0], caption_text(r, rest, x0, x1, book_lines).strip())
            images = [graphics[i] for i in members if graphics[i][1]]
            single = len(images) == 1 and images[0][0].contains(fitz.Rect(region.x0 + 2, region.y0 + 2, region.x1 - 2, region.y1 - 2))
            im = enhance(original_pixels(doc, images[0][1])) if single else rendered(render_page, region)
            if im is None:
                print(f'   ! {codes[0]}: empty render')
                continue
            slug = slug_of(codes[0])
            if slug in used_slugs:
                raise SystemExit(f'slug collision: {slug} ({codes[0]})')
            used_slugs.add(slug)
            save(im, slug)
            seen.update(codes)
            entries.append({'code': codes[0], 'label': ' · '.join(codes), 'kind': 'sign', 'name': name,
                            'image': f'book/{slug}.webp', 'page': pno - 8, 'source': 'pixels' if single else 'rendered'})


def figure_label(img, lines):
    """The «Σχ. x.y» label printed under a picture (part labels like «(β)» may sit in between)."""
    labels = sorted([(r, t) for r, t in lines if FIG_RE.match(t) and img.y1 - 3 <= r.y0 <= img.y1 + 40
                     and r.x0 < img.x1 + 40 and r.x1 > img.x0 - 40], key=lambda rt: rt[0].y0)
    return labels[0] if labels else None


def figure_caption(label, text, lines):
    """The label line plus the caption lines below it that overlap the caption block so far, until a gap."""
    picked, last_y, span = [text], label.y1, (label.x0, label.x1)
    for r, t in sorted(lines, key=lambda rt: rt[0].y0):
        if r.y0 <= label.y0 + 2 or min(r.x1, span[1]) - max(r.x0, span[0]) <= 0:
            continue  # above the label, or a line of the neighbouring column
        if r.y0 - last_y > CAPTION_GAP or FIG_RE.match(t):
            break
        picked.append(t)
        last_y = r.y1
        span = (min(span[0], r.x0), max(span[1], r.x1))
    return join_lines(picked)


def extract_figures(doc, render_doc, entries, used_slugs):
    """Figures (Σχ. x.y). A figure made of several pictures (e.g. 2.8 α/β) is rendered whole from the page."""
    seen = set()
    for pno in FIGURE_PAGES:
        page, render_page = doc[pno], render_doc[pno]
        for info in render_page.get_image_info(xrefs=True):
            if info['xref'] and is_watermark(fitz.Rect(info['bbox']), render_page):
                render_page.delete_image(info['xref'])
        lines = lines_of(page)
        figures = {}
        for info in page.get_image_info(xrefs=True):
            rect = fitz.Rect(info['bbox'])
            if not info['xref'] or rect.width < 25 or is_watermark(rect, page):
                continue
            found = figure_label(rect, lines)
            if not found:
                continue
            label, text = found
            f = FIG_RE.match(text)
            code = f'Σχ. {f.group(1)}.{f.group(2)}'
            figure = figures.setdefault(code, {'label': label, 'text': text, 'parts': []})
            figure['parts'].append((rect, info['xref']))
        for code, figure in figures.items():
            if code in seen:
                continue
            seen.add(code)
            caption = figure_caption(figure['label'], figure['text'], lines)
            name = caption[FIG_RE.match(caption).end():].strip()
            slug = slug_of(code)
            if slug in used_slugs:
                raise SystemExit(f'slug collision: {slug} ({code})')
            used_slugs.add(slug)
            parts = figure['parts']
            if len(parts) == 1:
                im, source = enhance(original_pixels(doc, parts[0][1])), 'pixels'
            else:
                region = fitz.Rect(parts[0][0])
                for rect, _ in parts[1:]:
                    region |= rect
                im, source = rendered(render_page, region), 'rendered'
            save(im, slug)
            entries.append({'code': code, 'label': code, 'kind': 'figure', 'name': name,
                            'image': f'book/{slug}.webp', 'page': pno - 8, 'source': source})


def main():
    doc, render_doc = fitz.open(PDF), fitz.open(PDF)
    if os.path.isdir(OUT_IMG):
        for f in os.listdir(OUT_IMG):
            os.remove(os.path.join(OUT_IMG, f))
    os.makedirs(OUT_IMG, exist_ok=True)
    entries, used_slugs = [], set()
    extract_signs(doc, render_doc, entries, used_slugs)
    extract_figures(doc, render_doc, entries, used_slugs)
    json.dump(entries, open(os.path.join(APP, 'scripts', 'official', 'book-signs.json'), 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)
    by = {}
    for e in entries:
        k = e['code'].split('-')[0] if e['kind'] == 'sign' else 'Σχ.'
        by[k] = by.get(k, 0) + 1
    rendered_count = sum(1 for e in entries if e['source'] == 'rendered')
    print(f'✓ {len(entries)} entries {by}; {rendered_count} rendered from vector/composite art, {len(used_slugs)} unique files')


main()
