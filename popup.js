// popup.js
document.addEventListener('DOMContentLoaded', () => {
    chrome.runtime.sendMessage({ type: 'GET_TAB_DATA' }, (response) => {
        // Handle unchecked runtime.lastError
        if (chrome.runtime.lastError) {
            console.warn("Could not get tab data:", chrome.runtime.lastError.message);
        }

        // Small delay just to show off the loading animation for UX 
        setTimeout(() => {
            document.getElementById('loading-state').classList.add('hidden');

            if (!response) {
                document.getElementById('no-data-state').classList.remove('hidden');
                return;
            }

            document.getElementById('result-state').classList.remove('hidden');

            const score = response.finalScore;
            const reasons = response.reasons;

            // Setup text
            const scoreVal = document.getElementById('score-value');

            // Counter animation
            let currentDisplayScore = 0;
            const targetScore = score;
            const duration = 1000;
            const stepTime = Math.abs(Math.floor(duration / (targetScore || 1)));

            const timer = setInterval(function () {
                if (currentDisplayScore >= targetScore) {
                    clearInterval(timer);
                    scoreVal.innerText = targetScore;
                } else {
                    currentDisplayScore++;
                    scoreVal.innerText = currentDisplayScore;
                }
            }, stepTime);

            // Define color based on score
            let color = '#22c55e'; // Green
            let statusText = 'Probably Safe';
            let statusClass = 'status-safe';

            if (score > 50) {
                color = '#eab308'; // Yellow
                statusText = 'Suspicious Site';
                statusClass = 'status-warning';
            }
            if (score >= 80) {
                color = '#ef4444'; // Red
                statusText = 'High Risk (Phishing)';
                statusClass = 'status-danger';
            }

            // Animate circle ring
            setTimeout(() => {
                const circle = document.getElementById('score-circle');
                circle.style.background = `conic-gradient(${color} ${score}%, #1e293b ${score}%)`;
            }, 50);

            scoreVal.style.color = color;

            // Status badge
            const badge = document.getElementById('status-badge');
            badge.innerText = statusText;
            badge.classList.add(statusClass);

            // List reasons
            if (reasons && reasons.length > 0) {
                const list = document.getElementById('reasons-list');
                list.innerHTML = '';
                reasons.forEach(r => {
                    const li = document.createElement('li');
                    li.innerText = r;
                    list.appendChild(li);
                });
            } else {
                document.getElementById('details-section').classList.add('hidden');
                document.getElementById('safe-indicator').classList.remove('hidden');
            }
        }, 600);
    });
});
