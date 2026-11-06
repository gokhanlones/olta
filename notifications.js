// OLTA bildirimleri: üst bandın sağındaki zil, okunmamış rozeti ve bildirim listesi.
// Şimdilik bildirim kaynağı: OLTA'nın ana sayfaya paylaştığı haberler (kullanıcı
// gönderileri hariç). Okundu bilgisi users/{uid}.notifSeenAt alanında tutulur,
// böylece farklı cihazlarda da aynı görünür.
// Bu dosya değiştiğinde, kullanan sayfalardaki import adresinde ?v= artırılmalı.
import { collection, query, orderBy, limit, getDocs, doc, getDoc, setDoc, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const SCAN = 30;                       // son kaç akış gönderisine bakılır
const FIRST_VISIT_DAYS = 7;            // hiç açmamış kullanıcıda son 7 günün haberleri okunmamış sayılır
const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const BELL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
  + '<path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 01-3.4 0"/></svg>';

let db = null, user = null, items = [], seenAt = 0;
let btn, badge, panel, backdrop, list, started = false;

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const ms = ts => ts?.toMillis?.() ?? 0;

export function initNotifications(opts) {
  if (started) return;
  started = true;
  db = opts.db; user = opts.user;
  injectStyles();
  buildUi();
  refresh();
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') refresh(); });
}

function injectStyles() {
  const st = document.createElement('style');
  st.textContent = `
    .notif-btn { position: relative; width: 38px; height: 38px; background: none; border: none; color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; padding: 0; border-radius: 10px; }
    .notif-btn svg { width: 24px; height: 24px; }
    .notif-btn:active { background: rgba(255,255,255,0.08); }
    .notif-badge { position: absolute; top: 3px; right: 2px; min-width: 17px; height: 17px; padding: 0 4px; border-radius: 9px; background: #EF4444; color: #fff; font-size: 10.5px; font-weight: 800; line-height: 17px; text-align: center; border: 2px solid #0A1628; box-sizing: content-box; }
    .notif-badge[hidden] { display: none; }
    .notif-backdrop { position: fixed; left: 0; right: 0; top: 56px; bottom: 0; background: rgba(0,0,0,0.45); z-index: 150; opacity: 0; visibility: hidden; transition: opacity .2s, visibility 0s linear .2s; }
    .notif-backdrop.open { opacity: 1; visibility: visible; transition: opacity .2s; }
    .notif-panel { position: fixed; left: 0; right: 0; top: 56px; max-height: calc(100% - 56px - 60px - env(safe-area-inset-bottom)); z-index: 151; background: #0A1628; border-bottom: 1px solid rgba(255,255,255,0.1); border-radius: 0 0 16px 16px; display: flex; flex-direction: column; transform: translateY(-8px); opacity: 0; visibility: hidden; transition: transform .2s, opacity .2s, visibility 0s linear .2s; }
    .notif-panel.open { transform: translateY(0); opacity: 1; visibility: visible; transition: transform .2s, opacity .2s; }
    .notif-head { padding: 14px 16px 10px; font-size: 11px; font-weight: 700; letter-spacing: 1px; color: #9DB4C8; border-bottom: 1px solid rgba(255,255,255,0.08); }
    .notif-list { overflow-y: auto; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; }
    .notif-item { display: flex; gap: 10px; align-items: flex-start; width: 100%; background: none; border: none; border-bottom: 1px solid rgba(255,255,255,0.05); color: #fff; text-align: left; padding: 12px 16px; cursor: pointer; font-family: inherit; }
    .notif-item:active { background: rgba(255,255,255,0.06); }
    .notif-item.new { background: rgba(46,134,171,0.14); }
    .notif-avatar { width: 34px; height: 34px; border-radius: 50%; background: #0A1628; border: 1.5px solid #2E86AB; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #fff; font-size: 7.5px; font-weight: 900; letter-spacing: 1px; padding-left: 1px; }
    .notif-body { flex: 1; min-width: 0; }
    .notif-title { font-size: 14px; font-weight: 700; line-height: 1.3; }
    .notif-text { font-size: 13px; color: #C9D8E4; margin-top: 2px; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .notif-time { font-size: 11.5px; color: #9DB4C8; margin-top: 4px; }
    .notif-dot { width: 8px; height: 8px; border-radius: 50%; background: #2E86AB; margin-top: 6px; flex-shrink: 0; }
    .notif-empty { color: #9DB4C8; font-size: 13.5px; text-align: center; padding: 26px 16px; }
  `;
  document.head.appendChild(st);
}

function buildUi() {
  const slot = document.querySelector('.banner-placeholder');
  if (!slot) return;
  btn = el('button', 'notif-btn');
  btn.setAttribute('aria-label', 'Bildirimler');
  btn.innerHTML = BELL;
  badge = el('span', 'notif-badge'); badge.hidden = true;
  btn.appendChild(badge);
  slot.replaceWith(btn);

  backdrop = el('div', 'notif-backdrop');
  panel = el('div', 'notif-panel');
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Bildirimler');
  panel.appendChild(el('div', 'notif-head', 'BİLDİRİMLER'));
  list = el('div', 'notif-list');
  panel.appendChild(list);
  document.body.append(backdrop, panel);

  btn.onclick = () => (panel.classList.contains('open') ? close() : open());
  backdrop.onclick = close;
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
}

async function refresh() {
  try {
    const [snap, u] = await Promise.all([
      getDocs(query(collection(db, 'feed_posts'), orderBy('createdAt', 'desc'), limit(SCAN))),
      getDoc(doc(db, 'users', user.uid)),
    ]);
    items = [];
    snap.forEach(d => {
      const p = d.data();
      if (p.type === 'user') return;                 // şimdilik yalnızca OLTA haberleri
      items.push({ id: d.id, ...p });
    });
    const saved = u.exists() ? ms(u.data().notifSeenAt) : 0;
    seenAt = saved || (Date.now() - FIRST_VISIT_DAYS * 86400e3);
    renderBadge();
    if (panel.classList.contains('open')) renderList();
  } catch (e) {
    console.warn('Bildirimler okunamadı:', e);
  }
}

const unread = () => items.filter(p => ms(p.createdAt) > seenAt).length;

function renderBadge() {
  const n = unread();
  badge.hidden = n === 0;
  badge.textContent = n > 9 ? '9+' : String(n);
  btn.setAttribute('aria-label', n ? `Bildirimler, ${n} okunmamış` : 'Bildirimler');
}

function titleOf(p) {
  if (p.type === 'spot_forecast') return `${p.species} için en uygun kıyılar`;
  return p.title || p.species || 'OLTA';
}

function timeOf(p) {
  const d = p.createdAt?.toDate?.();
  if (!d) return '';
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'Az önce';
  if (mins < 60) return `${mins} dk önce`;
  if (mins < 24 * 60) return `${Math.round(mins / 60)} sa önce`;
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function renderList() {
  list.innerHTML = '';
  if (!items.length) { list.appendChild(el('div', 'notif-empty', 'Henüz bildirim yok.')); return; }
  items.forEach(p => {
    const isNew = ms(p.createdAt) > seenAt;
    const it = el('button', 'notif-item' + (isNew ? ' new' : ''));
    const av = el('div', 'notif-avatar', 'OLTA');
    const body = el('div', 'notif-body');
    body.append(el('div', 'notif-title', titleOf(p)), el('div', 'notif-text', p.text || ''), el('div', 'notif-time', timeOf(p)));
    it.append(av, body);
    if (isNew) it.appendChild(el('span', 'notif-dot'));
    it.onclick = () => goTo(p.id);
    list.appendChild(it);
  });
}

function open() {
  renderList();                           // "yeni" vurgusu bu açılışta görünsün
  panel.classList.add('open'); backdrop.classList.add('open');
  markSeen();
}

function close() {
  if (!panel) return;
  panel.classList.remove('open'); backdrop.classList.remove('open');
}

async function markSeen() {
  if (!unread()) return;
  // Telefon saati geri olsa bile listedeki haberler okunmuş sayılsın
  seenAt = Math.max(Date.now(), ...items.map(p => ms(p.createdAt)));
  renderBadge();
  try {
    await setDoc(doc(db, 'users', user.uid), { notifSeenAt: serverTimestamp() }, { merge: true });
  } catch (e) {
    console.warn('Okundu bilgisi kaydedilemedi:', e);
  }
}

function goTo(postId) {
  close();
  const hash = '#post-' + encodeURIComponent(postId);
  if (/\/home\.html$/.test(location.pathname)) {
    if (location.hash === hash) window.dispatchEvent(new HashChangeEvent('hashchange'));
    else location.hash = hash;          // ana sayfa hashchange ile gönderiye kayar
  } else {
    location.href = 'home.html' + hash;
  }
}
