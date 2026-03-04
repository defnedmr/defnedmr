// background.js
const tabData = {};

const trustedBrands = [
  "google.com",
  "facebook.com",
  "apple.com",
  "microsoft.com",
  "amazon.com",
  "paypal.com",
  "instagram.com",
  "linkedin.com"
];

function isIPAddress(domain) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(domain);
}

function levenshtein(a, b) {
  const matrix = Array.from({ length: a.length + 1 }, () =>
    Array(b.length + 1).fill(0)
  );
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      matrix[i][j] =
        a[i - 1] === b[j - 1]
          ? matrix[i - 1][j - 1]
          : Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
    }
  }
  return matrix[a.length][b.length];
}

function analyzeUrl(url) {
  try {
    const parsed = new URL(url);
    const domain = parsed.hostname;
    const protocol = parsed.protocol;

    if (!domain || (protocol !== "http:" && protocol !== "https:"))
      return null;

    let riskFlags = [];
    let score = 0;

    // 1. HTTP kullanımı
    if (protocol === "http:") {
      score += 25;
      riskFlags.push("HTTPS kullanılmıyor.");
    }

    // 2. IP adresi kullanımı
    if (isIPAddress(domain)) {
      score += 40;
      riskFlags.push("Alan adı yerine IP adresi kullanılmış.");
    }

    // 3. Çok uzun domain
    if (domain.length > 30) {
      score += 15;
      riskFlags.push("Alan adı olağandışı uzun.");
    }

    // 4. Fazla alt domain
    if (domain.split(".").length > 4) {
      score += 20;
      riskFlags.push("Aşırı alt domain kullanımı.");
    }

    // 5. Punycode
    if (domain.includes("xn--")) {
      score += 35;
      riskFlags.push("Punycode (IDN) alan adı tespit edildi.");
    }

    // 6. @ karakteri
    if (url.includes("@")) {
      score += 40;
      riskFlags.push("@ karakteri ile domain gizleme tekniği.");
    }

    // 7. Query parametre analizi
    const suspiciousParams = ["redirect", "token", "verify", "login", "update", "secure"];
    suspiciousParams.forEach(param => {
      if (parsed.search.includes(param)) {
        score += 8;
        riskFlags.push(`Şüpheli parametre: ${param}`);
      }
    });

    // 8. Marka taklidi / typosquatting
    trustedBrands.forEach(brand => {
      const base = brand.split(".")[0];
      const domainBase = domain.split(".")[0];

      const distance = levenshtein(domainBase, base);
      if (distance > 0 && distance <= 2) {
        score += 35;
        riskFlags.push(`Muhtemel marka taklidi: ${base}`);
      }

      if (domain.includes(base) && !domain.endsWith(brand)) {
        score += 25;
        riskFlags.push(`Marka ismi içeriyor ancak resmi domain değil (${base}).`);
      }
    });

    score = Math.min(score, 100);

    return {
      domain,
      finalScore: score,
      reasons: riskFlags
    };

  } catch (e) {
    return null;
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    const analysis = analyzeUrl(tab.url);
    if (!analysis) return;

    tabData[tabId] = {
      ...analysis,
      jsScore: 0,
      jsReasons: []
    };
    updateUI(tabId);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'JS_ACTIVITY_ALERT' && sender.tab) {
    const tabId = sender.tab.id;
    if (tabData[tabId]) {
      tabData[tabId].jsScore += message.severity;
      tabData[tabId].jsReasons.push(message.reason);
      updateUI(tabId);
    }
  }

  if (message.type === 'GET_TAB_DATA') {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs.length === 0) {
        sendResponse(null);
        return;
      }
      const data = tabData[tabs[0].id] || null;
      if (data) {
        // Send a temporary object to popup that merges js scores
        const mergedScore = Math.min(data.finalScore + Math.min(data.jsScore, 30), 100);
        let allReasons = [...data.reasons];
        if (data.jsScore > 0) {
          const uniqueJs = [...new Set(data.jsReasons)];
          allReasons.push(`Arka planda şüpheli JavaScript aktivitesi tespit edildi: ${uniqueJs.join(', ')}.`);
        }
        sendResponse({
          ...data,
          finalScore: mergedScore,
          reasons: allReasons
        });
      } else {
        sendResponse(null);
      }
    });
    return true; // Keep message channel open for async response
  }
});

function updateUI(tabId) {
  const data = tabData[tabId];
  if (!data) return;

  // Calculate merged score for UI triggers (badge and banner)
  const score = Math.min(data.finalScore + Math.min(data.jsScore, 30), 100);
  let allReasons = [...data.reasons];
  if (data.jsScore > 0) {
    const uniqueJs = [...new Set(data.jsReasons)];
    allReasons.push(`Arka planda şüpheli JavaScript aktivitesi tespit edildi: ${uniqueJs.join(', ')}.`);
  }

  if (score >= 80) {
    chrome.tabs.sendMessage(tabId, {
      type: "SHOW_WARNING_BANNER",
      score: score,
      reasons: allReasons
    }).catch(() => { });
  }

  let color = "#22c55e";
  if (score > 50) color = "#eab308";
  if (score >= 80) color = "#ef4444";

  chrome.action.setBadgeBackgroundColor({ tabId, color });
  chrome.action.setBadgeText({ tabId, text: score.toString() });
}