/* דיני הכותל המערבי: מבנה התוכן. החומר יושלם בהמשך.
   כל פריט הוא טקסט מתוך המקורות המקובלים (תלמוד בבלי וירושלמי, שולחן ערוך, רמב"ם), עם מראה מקום מדויק.
   אין להוסיף פריט בלי מקור מאומת, ומומלץ שרב מוסמך יעבור על התוכן לפני פרסומו.
   הוספה: להכניס אובייקט למערך, למשל:
   { title: "כותרת", items: [ { text: "הטקסט המצוטט או מעובד מהמקור", source: "מראה מקום מדויק" } ] } */
window.KOTEL_DINIM = [];
(function () {
  const body = document.getElementById("kotelBody"); if (!body) return;
  const D = window.KOTEL_DINIM;
  if (!D.length) {
    body.innerHTML = '<p>החומר בהכנה. כאן יוצגו דיני הכותל המערבי, כולל דיני קריעה, כפי שמובאים בתלמוד, בשולחן ערוך וברמב"ם, עם מראה מקום לכל דין.</p>'
      + '<p><small>התוסף אינו פוסק הלכה למעשה. לשאלה במקרה מסוים יש לפנות לרב מוסמך.</small></p>';
    return;
  }
  D.forEach(sec => {
    const d = document.createElement("details"); d.className = "sd"; d.open = D.length === 1;
    const s = document.createElement("summary"), b = document.createElement("b"); b.textContent = sec.title; s.appendChild(b); d.appendChild(s);
    (sec.items || []).forEach(it => {
      const p = document.createElement("p"); p.textContent = it.text;
      if (it.source) { const m = document.createElement("small"); m.textContent = " (" + it.source + ")"; p.appendChild(m) }
      d.appendChild(p);
    });
    body.appendChild(d);
  });
  const f = document.createElement("p"); f.innerHTML = "<small>התוסף אינו פוסק הלכה למעשה. לשאלה במקרה מסוים יש לפנות לרב מוסמך.</small>"; body.appendChild(f);
})();
