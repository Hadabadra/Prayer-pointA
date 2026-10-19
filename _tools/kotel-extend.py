# מאריך את ציור הכותל כלפי מטה (2.5.2): הציור המקורי נחתך ודהה בתחתית, כי בצילום יש שם אנשים.
# לוקחים רצועת נדבכים נקייה מהחלק התחתון שלפני הדהייה, וחותכים אותה בדיוק על קווי הטיט,
# ומניחים אותה פעמיים מתחת (בפעם הראשונה הפוכה אופקית בחלק הכותל, כדי שלא תיראה חזרה).
# בלי אנשים: רק אבנים מהציור עצמו. שימוש: python3 kotel-extend.py kivun-tefila/kotel.js out.webp
import re, base64, io, sys
import numpy as np
from PIL import Image
t = open(sys.argv[1], encoding="utf8").read()
im = Image.open(io.BytesIO(base64.b64decode(re.search(r'base64,([^"]+)', t).group(1)))).convert("LA")
A = np.asarray(im.split()[-1], dtype=np.float32)
H0, W = A.shape; f0 = int(H0 * .85); X = 280          # X: גבול הבניין שמשמאל
d = A[:, X:].mean(axis=1)
peak = lambda lo, hi: lo + int(np.argmax(d[lo:hi]))   # שורת טיט = צפיפות קווים מרבית
e = peak(f0 - 30, f0); s = peak(e - 200, e - 150)
out = A[:e].copy()
for flip in (True, False):
    b = A[s:e].copy()
    if flip: b[:, X:] = b[:, X:][:, ::-1]
    out = np.vstack([out, b])
H = out.shape[0]; g = int(H * .94); out[g:] *= np.linspace(1, 0, H - g)[:, None]
a = Image.fromarray(np.clip(out, 0, 255).astype("uint8")); r = Image.new("LA", a.size, 0); r.putalpha(a)
r.save(sys.argv[2], "WEBP", quality=55, method=6); print(sys.argv[2], a.size)
