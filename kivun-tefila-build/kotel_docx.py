"""ממיר את החיבור "זכר לחורבן" (דור המלקטים, סימנים תק"ס–תקס"א) לנתוני התוסף.
לפי בקשת המפתחת: נכנסים רק שמות הפוסקים ומראי המקומות, בלי הציטוטים עצמם.
שימוש: python3 kivun-tefila-build/kotel_docx.py <file.docx> kivun-tefila/kotel-full.js
פלט: window.KOTEL_FULL = [ { siman, topics: [ { t, lines: [ [kind, text, refs] ] } ] } ]
  kind: "h" כותרת משנה, "p" טקסט, "s" שורת מקורות.  refs: [ [שם, מראה מקום] ] לפתיחה בספרייה.
"""
import json, re, sys
import docx

SIMAN_SA = {'סימן תק"ס': 'תקס', 'סימן תקס"א': 'תקסא'}
QUOTE_TAIL = re.compile(r'\s*[–-]\s*["“].*$')            # name (ref) – "ציטוט..."
INLINE_Q = re.compile(r',\s*["“][^"”]*?(?:\.\.\.|…)?[^)]*?["”]\s*\)')  # (ref, "ציטוט") -> (ref)
CITE = re.compile(r'([^\s,–(][^,–(]{0,40}?)\s*\(([^()]{1,80})\)')    # שם (מראה מקום)


def strip_quotes(t):
    t = QUOTE_TAIL.sub('', t)
    t = re.sub(r'^["“][^"”]{12,}["”]\s*[–-]\s*', '', t)        # "ציטוט" – שם (מקום)
    t = INLINE_Q.sub(')', t)
    if re.search(r',\s*["“][\u05d0-\u05ea\']+\s', t): t = re.sub(r',\s*["“][\u05d0-\u05ea\'].*$', ')', t)
    # ציטוט פתוח שנשאר בסוגריים: (ref, "....  -> (ref)
    t = re.sub(r',\s*["“][^)]*$', ')', t) if t.count('(') > t.count(')') else t
    return t.strip()


def refs_of(t):
    out = []
    for m in CITE.finditer(t):
        name = m.group(1).strip(' -–:')
        name = re.sub(r'^(הו"ד|ועי\'|עי\'|וכ"כ|כ"כ|מראי מקומות)\s*[–-]?\s*', '', name)
        if 1 < len(name) < 40:
            out.append([name, m.group(2).strip()])
    return out


def main(src, dst):
    d = docx.Document(src)
    paras = [p.text.strip() for p in d.paragraphs if p.style.name != 'footnote text']
    data, cur, topics, in_toc, topic = [], None, set(), False, None
    for t in paras:
        if not t or t == 'זכר לחורבן':
            continue
        if t in SIMAN_SA:
            cur = {'siman': t, 'sa': SIMAN_SA[t], 'topics': []}; data.append(cur)
            topics, in_toc, topic = set(), True, None
            continue
        if cur is None:
            continue
        if in_toc:
            if t.startswith('דור המלקטים'):
                in_toc = False
                cur['biblio'] = [n.strip() for n in re.split(r'\),\s*', t.split('–', 1)[-1]) if n.strip()]
            else:
                topics.add(t)
            continue
        if t in topics:
            topic = {'t': t, 'lines': []}; cur['topics'].append(topic); continue
        if topic is None:
            topic = {'t': 'כללי', 'lines': []}; cur['topics'].append(topic)
        s = strip_quotes(t)
        if not s:
            continue
        r = refs_of(s)
        kind = 'h' if (len(s) < 40 and s.endswith('.') and not r) else ('s' if r else 'p')
        topic['lines'].append([kind, s, r] if r else [kind, s])
    js = ('/* הלכות הכותל וזכר לחורבן — שמות הפוסקים ומראי המקומות בלבד, בלי ציטוטים.\n'
          '   מקור: החיבור "זכר לחורבן" (דור המלקטים, סימנים תק"ס–תקס"א) שצירפה המפתחת; הקובץ המלא ב-kivun-tefila-docs.\n'
          '   נוצר ע"י kivun-tefila-build/kotel_docx.py — לא לערוך ידנית. */\n'
          'window.KOTEL_FULL = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')
    open(dst, 'w', encoding='utf-8').write(js)
    n = sum(len(tp['lines']) for s in data for tp in s['topics'])
    print(f'{len(data)} סימנים, {sum(len(s["topics"]) for s in data)} נושאים, {n} שורות, {len(js)} תווים')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
