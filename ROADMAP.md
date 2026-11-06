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

## Deniz canlıları koleksiyonu (sonraya bırakıldı)
Kullanıcıya özel bir koleksiyon: kullanıcı **yalnızca yakaladığı** deniz
canlılarını kaydeder. Her kayıt o anın deniz koşullarıyla birlikte saklanır.
Yapay zekâ ile tür tanıma ve kamera kılavuzu bu bölümün parçası.
Kaynak rapor: "OLTA – Akıllı Av Kaydı ve Fotoğraf Doğrulama Sistemi"
(sürüm 1.0, 6 Kasım 2026); koleksiyon olarak yeniden çerçevelendi.

### Her kayıtta saklanacaklar
- **Canlı:** tür (yapay zekâ önerisi + kullanıcı onayı/düzeltmesi), fotoğraf,
  isteğe bağlı boy, ağırlık, yem, derinlik, not.
- **Konum ve zaman:** GPS koordinatı, GPS doğruluk değeri, tarih-saat.
- **O anın deniz verisi (sunucu kaydeder, kullanıcı değiştiremez):**
  yüzey sıcaklığı, tuzluluk, klorofil, oksijen, akıntı hızı/yönü, karışım
  tabakası derinliği, deniz seviyesi (olta-api `/marine`); dalga ve rüzgâr
  (Open-Meteo); türün o noktadaki uygunluk skoru. Kayıt anında bir kez alınıp
  kayda yazılır (sonradan yeniden hesaplanmaz).
- Ek fikir: ay evresi, gün doğumu/batımına göre saat (balıkçılar için anlamlı).

### Koleksiyon deneyimi
- Profilde "Koleksiyonum": yakalanan türler kart/ızgara olarak; her türün
  ilk yakalama tarihi, adet, en büyük boy. Henüz yakalanmamış türler gri
  (toplama hissi).
- Kayıt ayrıntısında fotoğraf + o günün deniz koşulları + küçük harita.
- Konum **varsayılan olarak gizli**: av noktası başkalarına gösterilmez;
  istenirse yalnızca bölge adı paylaşılır.

### Kamera kılavuzu ve yapay zekâ tür tanıma
- Uygulama içi kamera; yandan çekim için yarı saydam balık silüeti.
- İlk sürümde **engellemeyen** uyarılar: bulanıklık, ışık, balık kadrajda mı.
  Çekim butonunu kilitleme, model güvenilir hale gelince düşünülür.
- Tür tanıma: model önerir, kullanıcı onaylar ya da listeden düzeltir.
  Türkiye türleri için hazır etiketli veri yok; toplanan (kullanıcının
  onayladığı) fotoğraflar zamanla eğitim verisi olur. Bunun için kullanıcıdan
  ayrıca izin alınmalı.
- Model tarayıcıda (ör. TensorFlow.js / ONNX) ya da ayrı bir sunucuda çalışır;
  Render'daki ücretsiz 512 MB sunucu görüntü modeli için yetersiz.

### Toplu veri değeri
Farklı kişilerin aynı türü aynı bölgede yakalaması güçlü bir **varlık
gözlemi** verisi oluşturur: tür × bölge × mevsim × deniz koşulu.
Kullanım ve dikkat edilecekler:
- Uygunluk modelini **ölçmek** için: "avların yüzde kaçı uygunluk ≥ 50
  hücrelere düşüyor?" Zamanla tür aralıklarını (sıcaklık/tuzluluk) gerçek
  avlarla düzeltmek.
- **Örnekleme yanlılığı:** kayıtlar balığın değil balıkçının olduğu yerden
  gelir (kıyı, Boğaz, hafta sonu). Kayıt olmaması balık olmadığı anlamına
  gelmez.
- **Kıyı boşluğu:** Copernicus ızgarası ~8–10 km; kıyı avları için en yakın
  geçerli deniz hücresi kullanılmalı (klorofilde yapıldığı gibi).
- **Gizlilik:** toplu gösterimler bölge düzeyinde ve anonim; tek bir
  kullanıcının av noktası açığa çıkmamalı (KVKK; konum kişisel veri).
- **Kalite:** koleksiyon kişisel olduğu için ağır doğrulama gerekmez, ama toplu
  analize katılan kayıtlar için hafif kontroller yeterli: aynı fotoğrafın
  tekrarı (perceptual hash), GPS doğruluğu, konumun denizde/kıyıda olması,
  kullanıcı başına makul hız sınırı. Web'de kamera/konum bütünlüğü kesin
  kanıtlanamaz; bu yüzden toplu veride tek kayıt değil çoklu gözlem esas alınır.

### Başlamadan önce karar verilecekler
- Fotoğraf depolama: Firebase Storage (Blaze planı gerekebilir).
- Yasak dönemde ya da boy altı yakalanan canlıların kaydı: kabul edilecek mi,
  uyarı mı gösterilecek, toplu veriden mi çıkarılacak?
- İnternetsiz kullanım: kayıt cihazda bekleyip bağlantı gelince gönderilmeli
  (deniz verisi o zaman kayıt zamanına göre alınır).

## Geliştirici notları
- `feed-card.js` değiştiğinde, onu içe aktaran sayfalardaki (`home.html`,
  `profile.html`) `?v=` sürümü artırılmalı; yeni sürüm kontrolü yalnızca
  HTML'i karşılaştırıyor.
- Firestore güvenlik kuralları repoda değil, Firebase konsolunda; yeni bir
  koleksiyon ya da alan eklenince kurallar da güncellenmeli.
