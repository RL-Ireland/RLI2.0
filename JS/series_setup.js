// series_setup.js – Broadcast Overlay Control Panel
// Saves selected logos through WebSocket → images saved to Images/teams/
// Includes series rotation and default logo fallback.

document.addEventListener('DOMContentLoaded', () => {

    // ---- Global storage for saved logo paths (server-side) ----
    window.teamLogoPaths = {};

    const DEFAULT_LOGO = 'Images/teams/default.png';

    /**
     * Converts a file to base64 (without data URI prefix).
     */
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * Sends the logo file to the WebSocket server for saving.
     * teamId: e.g. 'currentA', 'other1B'
     */
    function saveLogoOnServer(file, teamId) {
        if (typeof WsSubscribers2 === 'undefined') {
            console.warn('WebSocket not ready. Logo will not be saved yet.');
            return;
        }

        fileToBase64(file).then(base64 => {
            WsSubscribers2.send("logo", "save", {
                teamId: teamId,
                fileName: file.name,
                fileData: base64
            });
        }).catch(err => {
            console.error('Base64 encoding failed:', err);
        });
    }

    /**
     * Handles a selected logo file:
     * - shows local preview
     * - sends it to the server for persistent storage
     */
    function handleLogoFile(file, imgElement, labelElement, teamId) {
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file.');
            return;
        }

        // Local preview
        const reader = new FileReader();
        reader.onload = (e) => {
            imgElement.src = e.target.result;
            imgElement.style.display = 'block';
            if (labelElement) labelElement.style.display = 'none';
        };
        reader.readAsDataURL(file);

        // Save to server
        saveLogoOnServer(file, teamId);
    }

    // ---------- Team Logo Input Mappings ----------
    const logoMappings = [
        { teamId: 'currentA', inputId: 'current-team-a-logo-input', imgId: 'current-team-a-logo-img', labelFor: 'current-team-a-logo-label' },
        { teamId: 'currentB', inputId: 'current-team-b-logo-input', imgId: 'current-team-b-logo-img', labelFor: 'current-team-b-logo-label' },
        { teamId: 'other1A', inputId: 'other-series-1-team-a-logo-input', imgId: 'other-series-1-team-a-logo-img', labelFor: 'other-series-1-team-a-logo-label' },
        { teamId: 'other1B', inputId: 'other-series-1-team-b-logo-input', imgId: 'other-series-1-team-b-logo-img', labelFor: 'other-series-1-team-b-logo-label' },
        { teamId: 'other2A', inputId: 'other-series-2-team-a-logo-input', imgId: 'other-series-2-team-a-logo-img', labelFor: 'other-series-2-team-a-logo-label' },
        { teamId: 'other2B', inputId: 'other-series-2-team-b-logo-input', imgId: 'other-series-2-team-b-logo-img', labelFor: 'other-series-2-team-b-logo-label' },
        { teamId: 'other3A', inputId: 'other-series-3-team-a-logo-input', imgId: 'other-series-3-team-a-logo-img', labelFor: 'other-series-3-team-a-logo-label' },
        { teamId: 'other3B', inputId: 'other-series-3-team-b-logo-input', imgId: 'other-series-3-team-b-logo-img', labelFor: 'other-series-3-team-b-logo-label' }
    ];

    logoMappings.forEach(({ teamId, inputId, imgId, labelFor }) => {
        const fileInput = document.getElementById(inputId);
        const imgElement = document.getElementById(imgId);
        const labelElement = document.querySelector(`label[for="${inputId}"]`);

        if (!fileInput || !imgElement) return;

        fileInput.addEventListener('change', function (event) {
            const file = event.target.files[0];
            if (file) handleLogoFile(file, imgElement, labelElement, teamId);
        });

        // Re‑open file dialog when the image is clicked
        imgElement.addEventListener('click', () => fileInput.click());
    });

    // ---------- Scroll Text Clear Buttons ----------
    for (let i = 1; i <= 4; i++) {
        const clearBtn = document.getElementById(`scroll-text-clear-${i}`);
        const inputField = document.getElementById(`scroll-text-input-${i}`);
        if (clearBtn && inputField) {
            clearBtn.addEventListener('click', () => {
                inputField.value = '';
                inputField.focus();
            });
        }
    }

    // ---------- Visibility Toggle Buttons ----------
    function setupVisibilityToggle(toggleBtnId, dotId, inputId) {
        const btn = document.getElementById(toggleBtnId);
        const dot = document.getElementById(dotId);
        const input = document.getElementById(inputId);
        if (!btn || !dot || !input) return;

        btn.addEventListener('click', () => {
            const isVisible = input.classList.contains('visibility-visible');
            if (isVisible) {
                input.value = 'Hidden';
                input.classList.remove('visibility-visible');
                input.classList.add('visibility-hidden');
                dot.classList.remove('visibility-dot-visible');
                dot.classList.add('visibility-dot-hidden');
            } else {
                input.value = 'Visible';
                input.classList.remove('visibility-hidden');
                input.classList.add('visibility-visible');
                dot.classList.remove('visibility-dot-hidden');
                dot.classList.add('visibility-dot-visible');
            }
        });
    }

    setupVisibilityToggle('current-series-visibility-toggle', 'current-series-visibility-dot', 'current-series-visibility-input');
    setupVisibilityToggle('other-series-1-vis-toggle', 'other-series-1-vis-dot', 'other-series-1-visibility-input');
    setupVisibilityToggle('other-series-2-vis-toggle', 'other-series-2-vis-dot', 'other-series-2-visibility-input');
    setupVisibilityToggle('other-series-3-vis-toggle', 'other-series-3-vis-dot', 'other-series-3-visibility-input');

    // ---------- Helper: set logo image state ----------
    function setLogoState(teamId, imgId, labelFor) {
        const img = document.getElementById(imgId);
        const label = document.querySelector(`label[for="${labelFor}"]`);
        if (!img) return;

        const savedPath = window.teamLogoPaths[teamId];
        if (savedPath && savedPath !== DEFAULT_LOGO) {
            img.src = savedPath;
            img.style.display = 'block';
            if (label) label.style.display = 'none';
        } else {
            // No custom logo – show default visually? We'll keep the + label.
            img.src = '';
            img.style.display = 'none';
            if (label) label.style.display = 'block';
        }
    }

    // ---------- Shift Series Logic ----------
    function gatherCurrentSeriesData() {
        return {
            name: document.getElementById('current-series-name-input').value,
            teamA: {
                name: document.getElementById('current-series-team-a-input').value,
                logoVisible: document.getElementById('current-team-a-logo-img').style.display === 'block'
            },
            teamB: {
                name: document.getElementById('current-series-team-b-input').value,
                logoVisible: document.getElementById('current-team-b-logo-img').style.display === 'block'
            },
            scoreA: document.getElementById('current-series-score-a-value').innerText,
            scoreB: document.getElementById('current-series-score-b-value').innerText,
            format: document.getElementById('current-series-format-select').value,
            visibility: document.getElementById('current-series-visibility-input').value
        };
    }

    function gatherOtherSeriesData(i) {
        return {
            name: document.getElementById(`other-series-${i}-name-input`).value,
            teamA: {
                name: document.getElementById(`other-series-${i}-team-a-input`).value,
                logoVisible: document.getElementById(`other-series-${i}-team-a-logo-img`).style.display === 'block'
            },
            teamB: {
                name: document.getElementById(`other-series-${i}-team-b-input`).value,
                logoVisible: document.getElementById(`other-series-${i}-team-b-logo-img`).style.display === 'block'
            },
            scoreA: document.getElementById(`other-series-${i}-score-a-value`).innerText,
            scoreB: document.getElementById(`other-series-${i}-score-b-value`).innerText,
            format: document.getElementById(`other-series-${i}-format-select`).value,
            visibility: document.getElementById(`other-series-${i}-visibility-input`).value
        };
    }

    function setCurrentSeries(data, logos) {
        document.getElementById('current-series-name-input').value = data.name;
        document.getElementById('current-series-team-a-input').value = data.teamA.name;
        document.getElementById('current-series-team-b-input').value = data.teamB.name;
        document.getElementById('current-series-score-a-value').innerText = data.scoreA;
        document.getElementById('current-series-score-b-value').innerText = data.scoreB;
        document.getElementById('current-series-format-select').value = data.format;
        const visInput = document.getElementById('current-series-visibility-input');
        visInput.value = data.visibility;
        const dot = document.getElementById('current-series-visibility-dot');
        if (data.visibility === 'Visible') {
            visInput.classList.remove('visibility-hidden');
            visInput.classList.add('visibility-visible');
            dot.classList.remove('visibility-dot-hidden');
            dot.classList.add('visibility-dot-visible');
        } else {
            visInput.classList.remove('visibility-visible');
            visInput.classList.add('visibility-hidden');
            dot.classList.remove('visibility-dot-visible');
            dot.classList.add('visibility-dot-hidden');
        }
        // Restore logo visibility (paths are already in teamLogoPaths)
        setLogoState('currentA', 'current-team-a-logo-img', 'current-team-a-logo-input');
        setLogoState('currentB', 'current-team-b-logo-img', 'current-team-b-logo-input');
    }

    function setOtherSeries(i, data) {
        document.getElementById(`other-series-${i}-name-input`).value = data.name;
        document.getElementById(`other-series-${i}-team-a-input`).value = data.teamA.name;
        document.getElementById(`other-series-${i}-team-b-input`).value = data.teamB.name;
        document.getElementById(`other-series-${i}-score-a-value`).innerText = data.scoreA;
        document.getElementById(`other-series-${i}-score-b-value`).innerText = data.scoreB;
        document.getElementById(`other-series-${i}-format-select`).value = data.format;
        const visInput = document.getElementById(`other-series-${i}-visibility-input`);
        visInput.value = data.visibility;
        const dot = document.getElementById(`other-series-${i}-vis-dot`);
        if (data.visibility === 'Visible') {
            visInput.classList.remove('visibility-hidden');
            visInput.classList.add('visibility-visible');
            dot.classList.remove('visibility-dot-hidden');
            dot.classList.add('visibility-dot-visible');
        } else {
            visInput.classList.remove('visibility-visible');
            visInput.classList.add('visibility-hidden');
            dot.classList.remove('visibility-dot-visible');
            dot.classList.add('visibility-dot-hidden');
        }
        setLogoState(`other${i}A`, `other-series-${i}-team-a-logo-img`, `other-series-${i}-team-a-logo-input`);
        setLogoState(`other${i}B`, `other-series-${i}-team-b-logo-img`, `other-series-${i}-team-b-logo-input`);
    }

    function shiftAllSeries() {
        // Gather current state of all four series
        const current = gatherCurrentSeriesData();
        const other1 = gatherOtherSeriesData(1);
        const other2 = gatherOtherSeriesData(2);
        const other3 = gatherOtherSeriesData(3);

        // Rotate saved logo paths: Other3→Other2, Other2→Other1, Other1→Current, Current→Other3
        const tempPaths = { ...window.teamLogoPaths };
        function rotatePath(fromTeamId, toTeamId) {
            window.teamLogoPaths[toTeamId] = tempPaths[fromTeamId] || DEFAULT_LOGO;
        }

        rotatePath('other3A', 'other2A');
        rotatePath('other3B', 'other2B');
        rotatePath('other2A', 'other1A');
        rotatePath('other2B', 'other1B');
        rotatePath('other1A', 'currentA');
        rotatePath('other1B', 'currentB');
        rotatePath('currentA', 'other3A');
        rotatePath('currentB', 'other3B');

        // Move the text / score / visibility data
        setOtherSeries(2, other3);   // 3 → 2
        setOtherSeries(1, other2);   // 2 → 1
        setCurrentSeries(other1);    // 1 → Current
        setOtherSeries(3, current);  // Current → 3
    }

    const shiftBtn = document.getElementById('shift-series-btn');
    if (shiftBtn) {
        shiftBtn.addEventListener('click', shiftAllSeries);
    }

    // ---------- Data Collection Function ----------
    function getLogoForTeam(teamId, imgElementId) {
        // Priority: saved server path > currently displayed src (if custom) > default
        const saved = window.teamLogoPaths[teamId];
        if (saved && saved !== DEFAULT_LOGO) {
            return saved;
        }
        const imgEl = document.getElementById(imgElementId);
        if (imgEl && imgEl.style.display !== 'none' && imgEl.src && !imgEl.src.endsWith(DEFAULT_LOGO)) {
            return imgEl.src; // data URL during preview
        }
        return DEFAULT_LOGO;
    }

    window.getOverlayData = function () {
        const data = {
            currentSeries: {
                name: document.getElementById('current-series-name-input')?.value || '',
                teamA: {
                    name: document.getElementById('current-series-team-a-input')?.value || '',
                    logo: getLogoForTeam('currentA', 'current-team-a-logo-img'),
                },
                teamB: {
                    name: document.getElementById('current-series-team-b-input')?.value || '',
                    logo: getLogoForTeam('currentB', 'current-team-b-logo-img'),
                },
                scoreA: document.getElementById('current-series-score-a-value')?.innerText || '0',
                scoreB: document.getElementById('current-series-score-b-value')?.innerText || '0',
                format: document.getElementById('current-series-format-select')?.value || 'Bo7',
                visibility: document.getElementById('current-series-visibility-input')?.value || 'Visible',
            },
            otherSeries: [],
            headline: document.getElementById('headline-text-input')?.value || '',
            scrollTexts: [],
        };

        for (let i = 1; i <= 3; i++) {
            const card = {
                name: document.getElementById(`other-series-${i}-name-input`)?.value || '',
                teamA: {
                    name: document.getElementById(`other-series-${i}-team-a-input`)?.value || '',
                    logo: getLogoForTeam(`other${i}A`, `other-series-${i}-team-a-logo-img`),
                },
                teamB: {
                    name: document.getElementById(`other-series-${i}-team-b-input`)?.value || '',
                    logo: getLogoForTeam(`other${i}B`, `other-series-${i}-team-b-logo-img`),
                },
                scoreA: document.getElementById(`other-series-${i}-score-a-value`)?.innerText || '0',
                scoreB: document.getElementById(`other-series-${i}-score-b-value`)?.innerText || '0',
                format: document.getElementById(`other-series-${i}-format-select`)?.value || 'Bo7',
                visibility: document.getElementById(`other-series-${i}-visibility-input`)?.value || 'Hidden',
            };
            data.otherSeries.push(card);
        }

        for (let j = 1; j <= 4; j++) {
            data.scrollTexts.push(document.getElementById(`scroll-text-input-${j}`)?.value || '');
        }

        return data;
    };

    console.log('Control panel ready. Logos saved via WebSocket. Shift series available.');
});

// ---------- Helper & WebSocket initialisation ----------
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

wait(10000).then(() => {
    WsSubscribers2.init(49322, true);
});

// Listen for saved logo paths from the server
WsSubscribers2.subscribe("logo", "saved", (data) => {
    if (data && data.teamId && data.savedPath) {
        window.teamLogoPaths[data.teamId] = data.savedPath;

        // Update the corresponding image element
        const imgMap = {
            'currentA': 'current-team-a-logo-img',
            'currentB': 'current-team-b-logo-img',
            'other1A': 'other-series-1-team-a-logo-img',
            'other1B': 'other-series-1-team-b-logo-img',
            'other2A': 'other-series-2-team-a-logo-img',
            'other2B': 'other-series-2-team-b-logo-img',
            'other3A': 'other-series-3-team-a-logo-img',
            'other3B': 'other-series-3-team-b-logo-img'
        };
        const imgEl = document.getElementById(imgMap[data.teamId]);
        if (imgEl) {
            imgEl.src = data.savedPath;
            imgEl.style.display = 'block';
            // Hide the + label
            const labelMap = {
                'currentA': 'current-team-a-logo-input',
                'currentB': 'current-team-b-logo-input',
                'other1A': 'other-series-1-team-a-logo-input',
                'other1B': 'other-series-1-team-b-logo-input',
                'other2A': 'other-series-2-team-a-logo-input',
                'other2B': 'other-series-2-team-b-logo-input',
                'other3A': 'other-series-3-team-a-logo-input',
                'other3B': 'other-series-3-team-b-logo-input'
            };
            const label = document.querySelector(`label[for="${labelMap[data.teamId]}"]`);
            if (label) label.style.display = 'none';
        }
        console.log(`Logo ${data.teamId} saved: ${data.savedPath}`);
    }
});

// Respond to overlay data requests
WsSubscribers2.subscribe("Data", "request", (d) => {
    WsSubscribers2.send("Data", "receive", window.getOverlayData());
});