(function () {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootstrapDevPayr);
    } else {
        bootstrapDevPayr();
    }

    async function bootstrapDevPayr() {
        const config = findDevPayrConfig();

        if (!config) {
            console.warn('[DevPayr] No valid configuration found in global scope.');
            return;
        }

        if (config.debug) {
            console.log('[DevPayr] Configuration detected:', config);
        }

        const license = config.license || config.lk;
        if (!license) {
            console.error('[DevPayr] No license key provided.');
            return;
        }

        const recheck = config.recheck === true;
        const hash = await hashLicense(license);
        const cacheKey = `devpayr:lastSuccess:${hash}`;
        const lastSuccess = localStorage.getItem(cacheKey);

        if (lastSuccess) {
            if (!recheck) {
                if (config.debug) console.log('[DevPayr] Skipping check — already validated permanently.');
                if (typeof config.onReady === 'function') config.onReady();
                return;
            } else if (isToday(lastSuccess)) {
                if (config.debug) console.log('[DevPayr] Skipping check — already validated today.');
                if (typeof config.onReady === 'function') config.onReady();
                return;
            }
        }

        const baseURL = config.baseUrl || 'https://api.devpayr.dev/api/v1/';
        const endpoint = new URL('project/has-paid', baseURL);

        const domain = resolveDevPayrDomain(config);

        if (config.checkType === 'check_project') {
            endpoint.searchParams.set('action', 'check_project');
        }

        if (config.injectables) {
            endpoint.searchParams.set('include', 'injectables');
        }

        fetch(endpoint.toString(), {
            method: 'POST',
            headers: {
                'X-LICENSE-KEY': license,
                ...(domain ? { 'X-Devpayr-Domain': domain } : {}),
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Requested-With': 'DevPayr-SDK'
            },
            body: '{}'
        })
            .then(response => {
                if (!response.ok) throw new Error('Request failed with status ' + response.status);
                return response.json();
            })
            .then(result => {
                if (config.debug) console.log('[DevPayr] Payment status response:', result);

                const data = result.data || {};

                if (data.has_paid === true) {
                    localStorage.setItem(cacheKey, new Date().toISOString());

                    if (typeof config.onReady === 'function') config.onReady();

                    if (config.injectables && config.injectablesEndpoint) {
                        if (Array.isArray(data.injectables)) {
                            if (config.debug) console.log('[DevPayr] Using inline injectables from response.');
                            forwardInjectables({ injectables: data.injectables }, config);
                        } else {
                            fetchInjectables(license, config, baseURL);
                        }
                    }
                } else {
                    handleInvalidLicense(config);
                }
            })
            .catch(err => {
                console.error('[DevPayr] Error during project check or injectables:', err);
                handleInvalidLicense(config);
            });
    }

    function findDevPayrConfig() {
        const globalKeys = Object.keys(window);
        for (let key of globalKeys) {
            try {
                const obj = window[key];
                if (obj && typeof obj === 'object') {
                    const hasLicense = typeof obj.license === 'string' || typeof obj.lk === 'string';
                    if (hasLicense) return obj;
                }
            } catch (_) {}
        }
        return null;
    }

    function handleInvalidLicense(config) {
        const mode = config.invalidBehavior || 'redirect';
        if (mode === 'modal') {
            showDevPayrModal(config.modalText);
        } else {
            window.location.href = config.redirectUrl || 'https://devpayr.com/upgrade';
        }
    }

    function showDevPayrModal(text) {
        const config = findDevPayrConfig();
        const theme = config.modalTheme || {};

        const primary = theme.primary || '#ff4d4d';
        const background = theme.background || '#1e1e1e';
        const textColor = theme.text || '#ffffff';
        const borderColor = theme.border || primary;
        const glowEnabled = theme.glow !== false;

        const emailHref = buildMailtoHref(config);
        const contactLabel = (typeof config.contactLabel === 'string' && config.contactLabel.trim())
            ? config.contactLabel.trim()
            : 'Contact Developer';

        const contactMode = (typeof config.contactMode === 'string' && config.contactMode.trim())
            ? config.contactMode.trim().toLowerCase()
            : 'mailto';

        const contactHref = contactMode === 'redirect'
            ? (config.contactUrl || config.redirectUrl || 'https://devpayr.com/upgrade')
            : emailHref;


        const message = text || 'The project owner did not pay the developer or is using an unsupported license. This software is unlicensed and potentially pirated.';

        const modal = document.createElement('div');
        modal.innerHTML = `
        <div style="
            position: fixed;
            inset: 0;
            background: radial-gradient(circle at center, rgba(0,0,0,0.9), rgba(0,0,0,0.95));
            backdrop-filter: blur(3px);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 99999;
            font-family: 'Segoe UI', sans-serif;
        ">
            <div style="
                background: ${background};
                border: 2px solid ${borderColor};
                box-shadow: ${glowEnabled ? `0 0 25px ${primary}, 0 0 60px ${primary}88` : 'none'};
                color: ${textColor};
                padding: 3rem 2rem;
                max-width: 600px;
                width: 90%;
                border-radius: 1rem;
                text-align: center;
                animation: ${glowEnabled ? 'pulseGlow 1.5s infinite alternate' : 'none'};
            ">
                <div style="margin-bottom: 1rem;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="${primary}" viewBox="0 0 24 24">
                        <path d="M1 21h22L12 2 1 21zm13-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                    </svg>
                </div>
                <h1 style="font-size: 2rem; font-weight: bold; margin-bottom: 1rem; color: ${primary};">
                    Unlicensed Software
                </h1>
                <p style="font-size: 1.125rem; line-height: 1.6; margin-bottom: 2rem;">
                    ${message}
                </p>

                <a href="${contactHref}" ${contactMode === 'redirect' ? 'target="_blank" rel="noopener noreferrer"' : ''} style="
                    display: inline-block;
                    margin-bottom: 1.5rem;
                    padding: 0.75rem 1.5rem;
                    font-size: 1rem;
                    font-weight: 600;
                    color: #000;
                    background-color: ${primary};
                    border-radius: 0.5rem;
                    text-decoration: none;
                    transition: background 0.3s ease;
                " onmouseover="this.style.opacity=0.85" onmouseout="this.style.opacity=1">
                    ${contactLabel}
                </a>

                <footer style="font-size: 0.875rem; color: #aaa;">
                    Powered by <a href="https://devpayr.com" target="_blank" rel="noopener noreferrer" style="color: ${textColor}; text-decoration: underline;">
                        DevPayr
                    </a>
                </footer>
            </div>
        </div>

        <style>
            @keyframes pulseGlow {
                from {
                    box-shadow: 0 0 15px ${primary}88, 0 0 30px ${primary}44;
                }
                to {
                    box-shadow: 0 0 25px ${primary}, 0 0 60px ${primary}66;
                }
            }
        </style>
        `;

        document.body.appendChild(modal);
    }

    function fetchInjectables(license, config, baseURL) {
        if (config.debug) {
            console.log('[DevPayr] Fetching injectables via stream...');
        }

        const domain = resolveDevPayrDomain(config);

        fetch(`${baseURL}injectable/stream`, {
            method: 'POST',
            headers: {
                'X-LICENSE-KEY': license,
                ...(domain ? { 'X-Devpayr-Domain': domain } : {}),
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-Requested-With': 'DevPayr-SDK'
            },
            body: JSON.stringify({
                license: license,
                projectId: config.projectId || null
            })
        })
            .then(response => {
                if (!response.ok) throw new Error('Injectable stream failed with status ' + response.status);
                return response.json();
            })
            .then(data => {
                if (config.debug) {
                    console.log('[DevPayr] Injectables received:', data);
                }
                forwardInjectables(data.data, config);
            })
            .catch(error => {
                console.error('[DevPayr] Failed to fetch injectables:', error);
            });
    }

    function forwardInjectables(payload, config) {
        if (!config.injectablesEndpoint) return;

        fetch(config.injectablesEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
            .then(res => {
                if (!res.ok) throw new Error('Forwarding failed with status ' + res.status);
                if (config.debug) {
                    console.log('[DevPayr] Injectables sent to backend successfully.');
                }
            })
            .catch(error => {
                console.error('[DevPayr] Failed to forward injectables to backend:', error);
            });
    }

    function isToday(isoDateString) {
        try {
            const saved = new Date(isoDateString);
            const now = new Date();
            return saved.getFullYear() === now.getFullYear() &&
                saved.getMonth() === now.getMonth() &&
                saved.getDate() === now.getDate();
        } catch (e) {
            return false;
        }
    }

    function resolveDevPayrDomain(config) {
        if (config && typeof config.domain === 'string' && config.domain.trim()) {
            return config.domain.trim();
        }

        try {
            const hostname = window.location && window.location.hostname ? String(window.location.hostname).trim() : '';
            return hostname || null;
        } catch (_) {
            return null;
        }
    }

    function resolveSupportEmail(config) {
        const candidates = [
            config?.developerEmail,
            config?.email,
            config?.supportEmail
        ];

        for (const v of candidates) {
            if (typeof v === 'string' && v.trim()) return v.trim();
        }

        return 'support@devpayr.com';
    }

    function buildMailtoHref(config) {
        const email = resolveSupportEmail(config);

        const subject =
            typeof config?.contactSubject === 'string' && config.contactSubject.trim()
                ? config.contactSubject.trim()
                : 'DevPayr License Issue';

        const body =
            typeof config?.contactBody === 'string' && config.contactBody.trim()
                ? config.contactBody.trim()
                : `Hi,\n\nI’m seeing an "Unlicensed Software" message in the app.\n\nDomain: ${safeLocationHost()}\n\nPlease assist.\n`;

        const params = new URLSearchParams();
        if (subject) params.set('subject', subject);
        if (body) params.set('body', body);

        return `mailto:${email}?${params.toString()}`;
    }

    function safeLocationHost() {
        try {
            return window.location?.host ? String(window.location.host) : '';
        } catch (_) {
            return '';
        }
    }

    function hashLicense(license) {
        const encoder = new TextEncoder();
        const data = encoder.encode(license);

        return crypto.subtle.digest('SHA-256', data).then(buffer => {
            return Array.from(new Uint8Array(buffer))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
        });
    }
})();
