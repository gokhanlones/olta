// OLTA gönderi kartı: ana sayfa ve profil ortak kullanır.
// Kart görünümü, beğeni (likes/{uid}), yorumlar (comments) ve paylaşım burada.
// Bu dosya değiştiğinde, kullanan sayfalardaki import adresinde ?v= artırılmalı.
import { collection, query, orderBy, limit, getDocs, doc, getDoc, setDoc, deleteDoc,
         addDoc, serverTimestamp, getCountFromServer }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

let db = null, currentUser = null, toast = () => {};

export function initFeedCards(opts) {
  db = opts.db; currentUser = opts.user; toast = opts.toast || toast;
  injectStyles();
}

function injectStyles() {
  if (document.getElementById('feed-card-styles')) return;
  const st = document.createElement('style');
  st.id = 'feed-card-styles';
  st.textContent = `
    .post.highlight { box-shadow: 0 0 0 2px var(--accent); }
    .post { transition: box-shadow .4s; scroll-margin-top: 66px; background: var(--blue-mid); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; overflow: hidden; }
    .post-head { display: flex; align-items: center; gap: 10px; padding: 14px 14px 0; }
    .post-avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--blue-dark); border: 1.5px solid var(--blue-light); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .post-avatar span { color: var(--white); font-size: 9.5px; font-weight: 900; letter-spacing: 1.3px; padding-left: 1.3px; line-height: 1; }
    .post-avatar.user { overflow: hidden; }
    .post-avatar.user img { width: 100%; height: 100%; object-fit: cover; }
    .post-avatar.user span { font-size: 17px; letter-spacing: 0; padding-left: 0; }
    .post-author { font-size: 14px; font-weight: 700; }
    .post-badge { font-size: 10px; font-weight: 600; color: var(--blue-dark); background: var(--accent); border-radius: 6px; padding: 1px 6px; margin-left: 6px; vertical-align: 1px; }
    .post-meta { font-size: 12px; color: #9DB4C8; margin-top: 2px; }
    .post-text { padding: 10px 14px 4px; font-size: 14.5px; line-height: 1.5; }
    .post-spots { display: flex; flex-direction: column; gap: 6px; padding: 8px 14px 12px; }
    .spot { display: flex; align-items: center; gap: 8px; text-decoration: none; color: var(--white); background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 10px 12px; font-size: 14px; }
    .spot:active { background: rgba(255,255,255,0.12); }
    .spot .name { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .spot .pct { font-weight: 800; }
    .spot .pct.high { color: #22C55E; } .spot .pct.moderate { color: #EAB308; } .spot .pct.low { color: #EA580C; }
    .spot .go { color: #9DB4C8; font-size: 18px; line-height: 1; }
    .post-actions { display: grid; grid-template-columns: repeat(3, 1fr); border-top: 1px solid rgba(255,255,255,0.08); }
    .act { display: flex; align-items: center; justify-content: center; gap: 6px; background: none; border: none; color: #C9D8E4; font-size: 13px; padding: 11px 4px; cursor: pointer; }
    .act svg { width: 19px; height: 19px; }
    .act:active { background: rgba(255,255,255,0.06); }
    .act.liked { color: #F87171; }
    .act.liked svg { fill: currentColor; }
    .comments { border-top: 1px solid rgba(255,255,255,0.08); padding: 10px 14px 12px; display: none; }
    .comments.open { display: block; }
    .comment { display: flex; gap: 8px; margin-bottom: 10px; }
    .comment img { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; flex-shrink: 0; background: rgba(255,255,255,0.1); }
    .comment-body { flex: 1; min-width: 0; background: rgba(255,255,255,0.06); border-radius: 10px; padding: 7px 10px; }
    .comment-name { font-size: 12px; font-weight: 700; }
    .comment-text { font-size: 13.5px; line-height: 1.4; margin-top: 2px; white-space: pre-wrap; word-wrap: break-word; }
    .comment-del { background: none; border: none; color: #F87171; font-size: 11px; cursor: pointer; padding: 2px 0 0; }
    .comments-empty { color: var(--gray); font-size: 13px; margin-bottom: 10px; }
    .comment-form { display: flex; gap: 8px; }
    .comment-form input { flex: 1; min-width: 0; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); border-radius: 18px; color: var(--white); padding: 9px 14px; font-size: 14px; outline: none; }
    .comment-form button { background: var(--blue-light); border: none; border-radius: 18px; color: var(--white); font-weight: 700; padding: 0 14px; cursor: pointer; }
    .comment-form button:disabled { opacity: .5; }
`;
  document.head.appendChild(st);
}

const ICON = {
  like:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 21s-7.5-4.6-9.6-9.3C1 8.3 3.1 4.5 6.9 4.5c2.1 0 3.6 1.1 5.1 3 1.5-1.9 3-3 5.1-3 3.8 0 5.9 3.8 4.5 7.2C19.5 16.4 12 21 12 21z"/></svg>',
  comment: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M21 12a8 8 0 01-11.6 7.1L4 20.5l1.4-4.6A8 8 0 1121 12z"/></svg>',
  share:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>',
};
const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const level = s => s >= 75 ? 'high' : s >= 50 ? 'moderate' : s >= 25 ? 'low' : '';
const spotUrl = (species, sp) => `forecast.html?tur=${encodeURIComponent(species)}&lat=${sp.lat}&lng=${sp.lng}`
  + (sp.cell_lat != null ? `&clat=${sp.cell_lat}&clng=${sp.cell_lng}` : '');
function fmtTs(ts) {
  const d = ts?.toDate?.();
  if (!d) return '';
  const hm = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  return `${d.getDate()} ${MONTHS[d.getMonth()]} · ${hm}`;
}
function fmtDate(iso) {
  const [y, m, d] = (iso || '').split('-').map(Number);
  return y ? `${d} ${MONTHS[m - 1]}` : '';
}

export function renderPost(p) {
  const post = el('article', 'post');
  post.id = 'post-' + p.id;

  const head = el('div', 'post-head');
  const isUser = p.type === 'user';
  const av = el('div', 'post-avatar' + (isUser ? ' user' : ''));
  if (!isUser) av.appendChild(el('span', null, 'OLTA'));
  else if (p.authorPhoto) { const img = el('img'); img.alt = ''; img.src = p.authorPhoto; av.appendChild(img); }
  else av.appendChild(el('span', null, (p.authorName || '?').trim().charAt(0).toLocaleUpperCase('tr')));
  const who = el('div');
  const author = el('div', 'post-author', isUser ? (p.authorName || 'Balıkçı') : (p.author?.name || 'OLTA'));
  if (!isUser) author.appendChild(el('span', 'post-badge', 'Deniz verisi'));
  who.appendChild(author);
  who.appendChild(el('div', 'post-meta', isUser ? fmtTs(p.createdAt) : [fmtDate(p.date), p.species].filter(Boolean).join(' · ')));
  head.append(av, who);
  post.appendChild(head);

  post.appendChild(el('p', 'post-text', p.text || ''));

  const spots = el('div', 'post-spots');
  (p.spots || []).forEach(sp => {
    const a = el('a', 'spot');
    a.href = spotUrl(p.species, sp);
    a.appendChild(el('span', null, '📍'));
    a.appendChild(el('span', 'name', sp.label || sp.place));
    a.appendChild(el('span', 'pct ' + level(sp.score), '%' + sp.score));
    a.appendChild(el('span', 'go', '›'));
    spots.appendChild(a);
  });
  post.appendChild(spots);

  // Beğen / Yorum yap / Paylaş
  const actions = el('div', 'post-actions');
  const likeBtn = el('button', 'act');    likeBtn.innerHTML = ICON.like + '<span>Beğen</span>';
  const comBtn  = el('button', 'act');    comBtn.innerHTML  = ICON.comment + '<span>Yorum</span>';
  const shrBtn  = el('button', 'act');    shrBtn.innerHTML  = ICON.share + '<span>Paylaş</span>';
  actions.append(likeBtn, comBtn, shrBtn);
  post.appendChild(actions);

  const comments = el('div', 'comments');
  post.appendChild(comments);

  setupLike(p, likeBtn);
  setupComments(p, comBtn, comments);
  shrBtn.onclick = () => sharePost(p);
  return post;
}

// ── BEĞEN: feed_posts/{id}/likes/{uid}  (kişi başına tek beğeni)
async function setupLike(p, btn) {
  const likesCol = collection(db, 'feed_posts', p.id, 'likes');
  const myLike   = doc(db, 'feed_posts', p.id, 'likes', currentUser.uid);
  let liked = false, count = 0, busy = false;
  const render = () => {
    btn.classList.toggle('liked', liked);
    btn.querySelector('span').textContent = count ? `${count} Beğeni` : 'Beğen';
  };
  try {
    const [mine, agg] = await Promise.all([getDoc(myLike), getCountFromServer(likesCol)]);
    liked = mine.exists(); count = agg.data().count; render();
  } catch (e) { console.warn('Beğeni okunamadı', e); }
  btn.onclick = async () => {
    if (busy) return; busy = true;
    const was = liked;
    liked = !was; count += liked ? 1 : -1; render();           // anında göster
    try {
      if (liked) await setDoc(myLike, { createdAt: serverTimestamp() });
      else await deleteDoc(myLike);
    } catch (e) {
      liked = was; count += liked ? 1 : -1; render();          // geri al
      toast('Beğeni kaydedilemedi');
    } finally { busy = false; }
  };
}

// ── YORUMLAR: feed_posts/{id}/comments/{auto}
async function setupComments(p, btn, box) {
  const col = collection(db, 'feed_posts', p.id, 'comments');
  let count = 0, loaded = false;
  const label = () => { btn.querySelector('span').textContent = count ? `${count} Yorum` : 'Yorum'; };
  try { count = (await getCountFromServer(col)).data().count; label(); } catch {}

  const list = el('div');
  const form = el('form', 'comment-form');
  const input = el('input'); input.placeholder = 'Yorum yaz…'; input.maxLength = 500;
  const send = el('button', null, 'Gönder'); send.type = 'submit';
  form.append(input, send);
  box.append(list, form);

  const renderComment = (id, c) => {
    const row = el('div', 'comment');
    const img = el('img'); img.alt = ''; if (c.photoURL) img.src = c.photoURL;
    const body = el('div', 'comment-body');
    body.appendChild(el('div', 'comment-name', c.name || 'Balıkçı'));
    body.appendChild(el('div', 'comment-text', c.text || ''));
    if (c.uid === currentUser.uid) {
      const del = el('button', 'comment-del', 'Sil');
      del.onclick = async () => {
        try { await deleteDoc(doc(db, 'feed_posts', p.id, 'comments', id)); row.remove(); count--; label(); emptyCheck(); }
        catch { toast('Yorum silinemedi'); }
      };
      body.appendChild(del);
    }
    row.append(img, body);
    return row;
  };
  const emptyCheck = () => {
    const has = list.querySelector('.comment');
    let e = list.querySelector('.comments-empty');
    if (!has && !e) list.appendChild(el('div', 'comments-empty', 'İlk yorumu sen yaz.'));
    if (has && e) e.remove();
  };

  btn.onclick = async () => {
    box.classList.toggle('open');
    if (!box.classList.contains('open') || loaded) return;
    loaded = true;
    try {
      const snap = await getDocs(query(col, orderBy('createdAt', 'asc'), limit(100)));
      snap.forEach(d => list.appendChild(renderComment(d.id, d.data())));
    } catch (e) { console.warn('Yorumlar okunamadı', e); }
    emptyCheck();
    input.focus();
  };

  form.onsubmit = async ev => {
    ev.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    send.disabled = true;
    const data = { uid: currentUser.uid, name: currentUser.displayName || 'Balıkçı',
                   photoURL: currentUser.photoURL || '', text, createdAt: serverTimestamp() };
    try {
      const ref = await addDoc(col, data);
      list.appendChild(renderComment(ref.id, data));
      input.value = ''; count++; label(); emptyCheck();
    } catch (e) { toast('Yorum gönderilemedi'); }
    finally { send.disabled = false; }
  };
}

// ── PAYLAŞ: telefonun paylaşım menüsü; yoksa bağlantıyı kopyala
async function sharePost(p) {
  const best = (p.spots || [])[0];
  const url  = best ? new URL(spotUrl(p.species, best), location.href).href
                    : new URL(`home.html#post-${encodeURIComponent(p.id)}`, location.href).href;
  const data = { title: p.type === 'user' ? `OLTA · ${p.authorName || 'Balıkçı'}` : `OLTA · ${p.species || ''}`.trim(), text: p.text || '', url };
  try {
    if (navigator.share) { await navigator.share(data); return; }
    await navigator.clipboard.writeText(`${data.text}\n${url}`);
    toast('Bağlantı kopyalandı');
  } catch (e) {
    if (e?.name !== 'AbortError') toast('Paylaşılamadı');
  }
}
