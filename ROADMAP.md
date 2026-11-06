# OLTA — Yapılacaklar

İleride yapılacak işler ve alınmış kararlar. Yeni bir işe başlamadan önce buraya bakın.

## Ana sayfa akışı

### Tür bilgisi gönderileri (ilk sırada)
Firestore'daki `fish` kayıtlarında ilgili bilgi varsa, ana sayfa akışında
OLTA adına kısa "biliyor muydunuz" gönderileri paylaşılacak. Örnek:

> Lüfer ürktüğünde çok yüksek hızlara çıkabilir. Oltanı sıkı tut!

Kararlar ve dikkat edilecekler:
- Bilgiler `fish` kaydında ayrı bir alanda tutulmalı (ör. `facts: [{ text, source }]`).
  Metin sunucuda bu alandan alınır; yapay zekâ ile üretilmez.
- Her bilgi bir kaynağa dayanmalı ve yayından önce kontrol edilmeli. Hız, boy,
  ağırlık gibi sayısal iddialar bilimsel bir kaynakla doğrulanmadan paylaşılmamalı.
  Birimler doğru yazılmalı (km/sa; km/s değil).
- Gönderi türü `type: 'species_fact'` olabilir. Günlük "en uygun kıyılar"
  gönderileriyle aynı API üretim adımında, günde en fazla 1–2 adet,
  türler sırayla.
- Kartta "Deniz verisi" yerine ayrı bir etiket kullanılmalı (ör. "Bilgi").
- Yasak dönemdeki türler için de paylaşılabilir (av önerisi değil, bilgi),
  ama metin avlanmaya teşvik etmemeli.

## Forum
- **Gönderiye fotoğraf:** Firebase Storage gerekiyor; yeni projelerde Blaze
  (kullandıkça öde) planı gerekebilir. Firebase planı kontrol edilmeli.
- **Bildirimler:** Gönderiye yorum ya da beğeni gelince kullanıcıya haber verilmesi.
- **Etkinlik geçmişinin tamamı:** Profildeki Etkinliğim şu an son 60 gönderiyi
  tarıyor (~2 hafta). Tüm geçmiş için collection group sorgusuna geçilmeli:
  `likes` belgelerine `uid` alanı, konsolda dizin ve kural gerekir.
- **Silinen gönderinin artıkları:** Silinen gönderinin `likes` ve `comments`
  alt kayıtları kalıyor (görünmüyor). Sunucu tarafında temizlenebilir.

## Reklam
- Akıştaki 320×50 banner şimdilik test. Gerçek reklam için AdSense vb. hesap
  açılıp site onaylatılmalı; yalnızca `feed-card`/`home.html` içindeki
  `.ad-slot` içeriği değişecek.

## Veri / API (olta-api)
- **Ocak 2027 başı:** Copernicus, Karadeniz NRT klorofil setinin şu anki sürümünü
  (`202207`) 12 Ocak 2027'de kaldırıyor. `/marine` yanıtında
  `chlorophyll_source` hâlâ `blacksea_nrt_1km` mi kontrol edilmeli.
- **Av kaydı ve fotoğraf doğrulama:** Ayrı bir algoritmik katman olarak
  sonraya bırakıldı (rapor: "OLTA – Akıllı Av Kaydı ve Fotoğraf Doğrulama Sistemi").

## Geliştirici notları
- `feed-card.js` değiştiğinde, onu içe aktaran sayfalardaki (`home.html`,
  `profile.html`) `?v=` sürümü artırılmalı; yeni sürüm kontrolü yalnızca
  HTML'i karşılaştırıyor.
- Firestore güvenlik kuralları repoda değil, Firebase konsolunda; yeni bir
  koleksiyon ya da alan eklenince kurallar da güncellenmeli.
