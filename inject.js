// inject.js
// Runs in the main page context to monitor malicious behavior

(function () {
    const originalEval = window.eval;
    const originalDocWrite = document.write;

    // Send message to content.js
    function reportSuspicious(reason, severity) {
        window.postMessage({
            source: 'PHISHGUARD_INJECT',
            reason: reason,
            severity: severity
        }, '*');
    }

    // Override eval
    window.eval = function (str) {
        if (typeof str === 'string' && (str.includes('unescape') || str.includes('atob') || str.length > 500)) {
            reportSuspicious('Obfuscated code evaluated via eval()', 15);
        }
        return originalEval.apply(this, arguments);
    };

    // Override document.write
    document.write = function (str) {
        if (typeof str === 'string' && (str.includes('<script') || str.includes('%'))) {
            reportSuspicious('Script/payload injected via document.write()', 20);
        }
        return originalDocWrite.apply(this, arguments);
    };

    // Intercept Canvas fingerprinting attempt (common in advanced phishing/tracking)
    try {
        const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
        HTMLCanvasElement.prototype.toDataURL = function () {
            reportSuspicious('Canvas fingerprinting detected (Gelişmiş takip/analiz)', 10);
            return originalToDataURL.apply(this, arguments);
        };
    } catch (e) {
        // ignore if not supported
    }
})();
