# PhishGuard 2026 Walkthrough

Harika haber! Gelişmiş oltalama (phishing) koruması sağlayan tarayıcı eklentimizin çekirdeğini ve arayüzünü başarıyla tamamladım.

## 🚀 Neler Yapıldı?

1. **Manifest V3 Uyumluluğu:** Chrome, Edge ve Brave gibi Chromium tabanlı tarayıcılarda çalışacak, son teknoloji `manifest.json` dosyası oluşturuldu.
2. **Arka Plan Motoru (`background.js`):** Kullanıcı yeni sekme açtığında devreye giren analiz motoru yazıldı. Bu motor şimdilik "test", "phish", "danger" ve "malware" kelimelerini içeren alan adlarını otomatik olarak yakalayıp yüksek risk puanı üretiyor. Diğer siteler için Domain Yaşı ve SSL kalitesi mock (simüle edilmiş) verilerle hesaplanıyor.
3. **Sayfa İçi Analiz ve JavaScript Koruması (`content.js` & `inject.js`):** Sayfa yüklenir yüklenmez devreye giren gelişmiş enjeksiyon mekanizması yazıldı. Bu sistem, sayfa içindeki şüpheli `eval()`, `document.write()` ve "Canvas Fingerprinting" denemelerini anlık tespit edip ana motora bildiriyor.
4. **Kritik Güvenlik Uyarısı Afişi (`inject.css`):** Puan %80'in üzerine çıktığında sayfanın tam üstüne mükemmel görünümlü (Glassmorphism), kapkaranlık ve kırmızı ışıklı dev bir uyarı ekranı iniyor. İstediğiniz gibi kullanıcı isterse "Sebepleri Gör" butonuna tıklayarak puanı neden aldığını detaylı olarak inceleyebiliyor.
5. **Aesthetic Popup Arayüzü (`popup.html`, `popup.css`, `popup.js`):** Vanilla CSS kullanılarak çok yetenekli, dark mode temalı, skorun mükemmel bir dairesel animasyonla dolduğu modern bir uzantı menüsü tasarlandı.

## 🛠️ Nasıl Test Edilir?

Şu adımları takip ederek eklentiyi hemen tarayıcınızda deneyebilirsiniz:

1. **Chrome veya Edge** tarayıcınızı açın.
2. Adres çubuğuna `chrome://extensions/` (veya Edge kullanıyorsanız `edge://extensions/`) yazın ve Enter'a basın.
3. Sağ üst köşeden **Geliştirici modunu (Developer mode)** aktif hale getirin.
4. Sol üstteki **"Paketlenmemiş öğe yükle" (Load unpacked)** butonuna tıklayın.
5. Klasör seçici açıldığında `c:\Development\webex` dizinini seçin.
6. Artık tarayıcınızın sağ üstünde uzantıyı görebilirsiniz (Uzantılar simgesinden pinglemenizi tavsiye ederim).

### Test Senaryoları:
- **Güvenli Site Testi:** `https://google.com` adresine girin ve uzantı simgesine tıklayın. Skorun yeşil ve düşük olduğunu göreceksiniz.
- **Tehlikeli Site (Phishing) Testi:** Adresinde "test" geçen bir siteye girin (Örn: `https://example.test` veya bilindik bir test sitesi olan `https://speedtest.net` - sadece test amaçlı!). 
   - Sayfa açılır açılmaz ekrana **Kırmızı Kritik Uyarı** ekranının indiğini göreceksiniz.
   - Bu ekranda **"Sebepleri Gör"** derseniz, alan adındaki şüpheli kelimeler, SSL eksikliği vs. gibi sebepleri listeleyecektir.
   - Uzantı simgesine tıklarsanız aynı şekilde 80+ kırmızı tehlike skorunu şık arayüzde görebilirsiniz.
   
*Not: İleride kendi backend API'nizi yazdığınızda `background.js` içindeki `analyzeUrl` fonksiyonunu gerçek API çağrılarıyla güncelleyebilirsiniz.*
