// content.js
// Inject script to monitor JS in the main world page context
const script = document.createElement('script');
script.src = chrome.runtime.getURL('inject.js');
script.onload = function () {
    this.remove();
};
(document.head || document.documentElement).appendChild(script);

// Listen for messages from injected script
window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data || event.data.source !== 'PHISHGUARD_INJECT') {
        return;
    }

    chrome.runtime.sendMessage({
        type: 'JS_ACTIVITY_ALERT',
        reason: event.data.reason,
        severity: event.data.severity
    });
});

// Listen for background script sending warning
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SHOW_WARNING_BANNER') {
        showBanner(message.score, message.reasons);
    }
});

let bannerInjected = false;

function showBanner(score, reasons) {
    if (bannerInjected) {
        // Update existing if present
        const scoreEl = document.getElementById('phishguard-score-val');
        if (scoreEl) scoreEl.innerText = `${score}%`;
        return;
    }

    // Wait until document body is available
    if (!document.body) {
        setTimeout(() => showBanner(score, reasons), 100);
        return;
    }

    bannerInjected = true;

    const bannerHtml = `
        <div id="phishguard-overlay" class="phishguard-glass">
            <div class="phishguard-content">
                <div class="phishguard-header">
                    <div class="phishguard-icon-pulse">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    </div>
                    <h2>KRİTİK GÜVENLİK UYARISI</h2>
                </div>
                
                <p class="phishguard-subtitle">Bu sitenin oltalama (phishing) riski çok yüksektir.</p>
                
                <div class="phishguard-score-container">
                    <div class="phishguard-score-circle">
                        <span id="phishguard-score-val">${score}%</span>
                    </div>
                    <div class="phishguard-score-label">Risk<br>Skoru</div>
                </div>
                
                <button id="phishguard-details-btn">Sebepleri Gör</button>
                
                <div id="phishguard-reasons" class="phishguard-hidden">
                    <ul>
                        ${reasons.map(r => `<li>${r}</li>`).join('')}
                    </ul>
                </div>
                
                <button id="phishguard-close-btn">Uyarıyı Gizle ve Riskli Siteye Devam Et</button>
            </div>
        </div>
    `;

    const container = document.createElement('div');
    container.innerHTML = bannerHtml;
    document.body.appendChild(container);

    document.getElementById('phishguard-details-btn').addEventListener('click', () => {
        const reasonsEl = document.getElementById('phishguard-reasons');
        if (reasonsEl.classList.contains('phishguard-hidden')) {
            reasonsEl.classList.remove('phishguard-hidden');
            document.getElementById('phishguard-details-btn').innerText = 'Sebepleri Gizle';
        } else {
            reasonsEl.classList.add('phishguard-hidden');
            document.getElementById('phishguard-details-btn').innerText = 'Sebepleri Gör';
        }
    });

    document.getElementById('phishguard-close-btn').addEventListener('click', () => {
        document.getElementById('phishguard-overlay').style.opacity = '0';
        setTimeout(() => container.remove(), 500);
    });
}
