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

## Av kaydı ve fotoğraf doğrulama (sonraya bırakıldı)
Kaynak: "OLTA – Akıllı Av Kaydı ve Fotoğraf Doğrulama Sistemi" raporu
(sürüm 1.0, 6 Kasım 2026). Forum önceliği nedeniyle **ayrı bir algoritmik
katman** olarak ertelendi.

### Raporun amacı
Kullanıcıların yakaladıkları balığı uygulama içi kamerayla fotoğraflayıp konum
ve zamanla kaydetmesi; doğrulanmış kayıtlarla habitat tahmin modelinin
geliştirilmesi. Öneriler: galeriden yükleme yok, standart yandan çekim, kamera
rehberi ve koşullar sağlanmadan kilitli çekim butonu, GPS/zaman otomatik,
görsel parmak izi ile mükerrer kayıt kontrolü, 0–100 güven puanı, Firebase
koleksiyonları (`catch_records`, `catch_verifications`, `catch_reports`),
Copernicus verisiyle eşleştirme.

### Değerlendirmede çıkan önemli noktalar
- **Web'de kamera/GPS bütünlüğü kanıtlanamaz.** OLTA bir web uygulaması:
  tarayıcı kodu değiştirilebilir, sahte fotoğraf doğrudan gönderilebilir,
  sahte konum tespit edilemez. Gerçek cihaz doğrulaması için yerel uygulama
  gerekir (Play Integrity / App Attest). Web'de kalınırsa doğrulama yalnızca
  sunucu tarafı kontrollere dayanır.
- **Yapay zekâ kamera kilidi en riskli kısım.** Balık tespiti, baş/kuyruk ve
  açı ölçümü için hazır model ve Türkiye türleri için etiketli veri yok.
  Önce engellemeyen bir rehber (silüet + bulanıklık/ışık uyarısı); model,
  toplanan fotoğraflarla eğitildikten sonra kilit.
- **Aynı balığın farklı fotoğrafını tanımak** desensiz türlerde pratikte
  mümkün değil; yalnızca aynı fotoğrafın tekrarı (perceptual hash) yakalanmalı.
- **Tür ilk sürümde kullanıcı tarafından seçilmeli** (raporda Aşama 1 akışında
  yapay zekâ tahmini vardı, ama otomatik tanıma Aşama 5'teydi). Fotoğrafların
  model eğitiminde kullanımı için ayrıca izin alınmalı.
- **Habitat modeline katkı:**
  - Örnekleme yanlılığı: kayıtlar balığın değil balıkçının olduğu yerden gelir
    (kıyı, Boğaz, hafta sonu); model buna göre düzeltilmeli.
  - Kıyı boşluğu: Copernicus ızgarası ~8–10 km; kıyı avları veri olmayan
    hücrelere düşer, en yakın geçerli deniz hücresi kullanılmalı.
  - Kısa vadede model değiştirmek yerine **ölçmek**: "avların yüzde kaçı
    uygunluk ≥ 50 hücrelere düşüyor?"
- **Altyapı:** Fotoğraf için Firebase Storage (Blaze planı gerekebilir);
  görüntü benzerlik modelleri Render'daki ücretsiz 512 MB sunucuya sığmaz.
  Güven puanı yalnızca sunucuda hesaplanmalı, kullanıcı yazamamalı.
- **Rapordaki eksikler:** yasak dönem / boy altı av kaydı politikası, KVKK
  (konum ve fotoğraf kişisel veri; av noktaları varsayılan gizli), internetsiz
  kullanım (kayıt cihazda bekleyip sonra gönderilmeli), moderasyon.

### Önerilen sıra (başlanırsa)
1. Uygulama içi kamera (galeri yok), silüet rehberi, basit bulanıklık/ışık
   uyarısı (engellemeyen), GPS + doğruluk + zaman, tür listeden, isteğe bağlı
   boy/ağırlık/yem; Storage + `catch_records`; sıkı güvenlik kuralları.
2. Sunucu (olta-api): aynı fotoğraf kontrolü (perceptual hash), kullanıcı başına
   hız sınırı, konum mantık kontrolü (denizde/kıyıda mı, iki kayıt arası mümkün
   mü), kayıt anının deniz verisi (`/marine`), güven puanı.
3. Ölçüm sayfası: avlar ile uygunluk skorlarının karşılaştırması.
4. Sonra: yapay zekâ kamera kilidi, otomatik tür tanıma, aynı balığı tanıma.

### Başlamadan önce karar verilecekler
- Web'de mi kalınacak, yerel uygulama mı yapılacak?
- Firebase Blaze planına geçilecek mi?
- Yasak dönem ve boy altı kayıtlar için politika ne olacak?

## Geliştirici notları
- `feed-card.js` değiştiğinde, onu içe aktaran sayfalardaki (`home.html`,
  `profile.html`) `?v=` sürümü artırılmalı; yeni sürüm kontrolü yalnızca
  HTML'i karşılaştırıyor.
- Firestore güvenlik kuralları repoda değil, Firebase konsolunda; yeni bir
  koleksiyon ya da alan eklenince kurallar da güncellenmeli.
