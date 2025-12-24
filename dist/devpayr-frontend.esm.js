(function(){document.readyState==="loading"?document.addEventListener("DOMContentLoaded",p):p();async function p(){let e=f();if(!e){console.warn("[DevPayr] No valid configuration found in global scope.");return}e.debug&&console.log("[DevPayr] Configuration detected:",e);let t=e.license||e.lk;if(!t){console.error("[DevPayr] No license key provided.");return}let o=e.recheck===!0,r=`devpayr:lastSuccess:${await S(t)}`,s=localStorage.getItem(r);if(s)if(o){if(v(s)){e.debug&&console.log("[DevPayr] Skipping check \u2014 already validated today."),typeof e.onReady=="function"&&e.onReady();return}}else{e.debug&&console.log("[DevPayr] Skipping check \u2014 already validated permanently."),typeof e.onReady=="function"&&e.onReady();return}let l=e.baseUrl||"https://api.devpayr.dev/api/v1/",i=new URL("project/has-paid",l),d=m(e);e.checkType==="check_project"&&i.searchParams.set("action","check_project"),e.injectables&&i.searchParams.set("include","injectables"),fetch(i.toString(),{method:"POST",headers:{"X-LICENSE-KEY":t,...d?{"X-Devpayr-Domain":d}:{},Accept:"application/json","Content-Type":"application/json","X-Requested-With":"DevPayr-SDK"},body:"{}"}).then(a=>{if(!a.ok)throw new Error("Request failed with status "+a.status);return a.json()}).then(a=>{e.debug&&console.log("[DevPayr] Payment status response:",a);let c=a.data||{};c.has_paid===!0?(localStorage.setItem(r,new Date().toISOString()),typeof e.onReady=="function"&&e.onReady(),e.injectables&&e.injectablesEndpoint&&(Array.isArray(c.injectables)?(e.debug&&console.log("[DevPayr] Using inline injectables from response."),u({injectables:c.injectables},e)):g(t,e,l))):y(e)}).catch(a=>{console.error("[DevPayr] Error during project check or injectables:",a),y(e)})}function f(){let e=Object.keys(window);for(let t of e)try{let o=window[t];if(o&&typeof o=="object"&&(typeof o.license=="string"||typeof o.lk=="string"))return o}catch{}return null}function y(e){(e.invalidBehavior||"redirect")==="modal"?b(e.modalText):window.location.href=e.redirectUrl||"https://devpayr.com/upgrade"}function b(e){let t=f(),o=t.modalTheme||{},n=o.primary||"#ff4d4d",r=o.background||"#1e1e1e",s=o.text||"#ffffff",l=o.border||n,i=o.glow!==!1,d=j(t),a=typeof t.contactLabel=="string"&&t.contactLabel.trim()?t.contactLabel.trim():"Contact Developer",c=typeof t.contactMode=="string"&&t.contactMode.trim()?t.contactMode.trim().toLowerCase():"mailto",k=c==="redirect"?t.contactUrl||t.redirectUrl||"https://devpayr.com/upgrade":d,P=e||"The project owner did not pay the developer or is using an unsupported license. This software is unlicensed and potentially pirated.",h=document.createElement("div");h.innerHTML=`
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
                background: ${r};
                border: 2px solid ${l};
                box-shadow: ${i?`0 0 25px ${n}, 0 0 60px ${n}88`:"none"};
                color: ${s};
                padding: 3rem 2rem;
                max-width: 600px;
                width: 90%;
                border-radius: 1rem;
                text-align: center;
                animation: ${i?"pulseGlow 1.5s infinite alternate":"none"};
            ">
                <div style="margin-bottom: 1rem;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="${n}" viewBox="0 0 24 24">
                        <path d="M1 21h22L12 2 1 21zm13-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                    </svg>
                </div>
                <h1 style="font-size: 2rem; font-weight: bold; margin-bottom: 1rem; color: ${n};">
                    Unlicensed Software
                </h1>
                <p style="font-size: 1.125rem; line-height: 1.6; margin-bottom: 2rem;">
                    ${P}
                </p>

                <a href="${k}" ${c==="redirect"?'target="_blank" rel="noopener noreferrer"':""} style="
                    display: inline-block;
                    margin-bottom: 1.5rem;
                    padding: 0.75rem 1.5rem;
                    font-size: 1rem;
                    font-weight: 600;
                    color: #000;
                    background-color: ${n};
                    border-radius: 0.5rem;
                    text-decoration: none;
                    transition: background 0.3s ease;
                " onmouseover="this.style.opacity=0.85" onmouseout="this.style.opacity=1">
                    ${a}
                </a>

                <footer style="font-size: 0.875rem; color: #aaa;">
                    Powered by <a href="https://devpayr.com" target="_blank" rel="noopener noreferrer" style="color: ${s}; text-decoration: underline;">
                        DevPayr
                    </a>
                </footer>
            </div>
        </div>

        <style>
            @keyframes pulseGlow {
                from {
                    box-shadow: 0 0 15px ${n}88, 0 0 30px ${n}44;
                }
                to {
                    box-shadow: 0 0 25px ${n}, 0 0 60px ${n}66;
                }
            }
        </style>
        `,document.body.appendChild(h)}function g(e,t,o){t.debug&&console.log("[DevPayr] Fetching injectables via stream...");let n=m(t);fetch(`${o}injectable/stream`,{method:"POST",headers:{"X-LICENSE-KEY":e,...n?{"X-Devpayr-Domain":n}:{},Accept:"application/json","Content-Type":"application/json","X-Requested-With":"DevPayr-SDK"},body:JSON.stringify({license:e,projectId:t.projectId||null})}).then(r=>{if(!r.ok)throw new Error("Injectable stream failed with status "+r.status);return r.json()}).then(r=>{t.debug&&console.log("[DevPayr] Injectables received:",r),u(r.data,t)}).catch(r=>{console.error("[DevPayr] Failed to fetch injectables:",r)})}function u(e,t){t.injectablesEndpoint&&fetch(t.injectablesEndpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)}).then(o=>{if(!o.ok)throw new Error("Forwarding failed with status "+o.status);t.debug&&console.log("[DevPayr] Injectables sent to backend successfully.")}).catch(o=>{console.error("[DevPayr] Failed to forward injectables to backend:",o)})}function v(e){try{let t=new Date(e),o=new Date;return t.getFullYear()===o.getFullYear()&&t.getMonth()===o.getMonth()&&t.getDate()===o.getDate()}catch{return!1}}function m(e){if(e&&typeof e.domain=="string"&&e.domain.trim())return e.domain.trim();try{return(window.location&&window.location.hostname?String(window.location.hostname).trim():"")||null}catch{return null}}function w(e){let t=[e?.developerEmail,e?.email,e?.supportEmail];for(let o of t)if(typeof o=="string"&&o.trim())return o.trim();return"support@devpayr.com"}function j(e){let t=w(e),o=typeof e?.contactSubject=="string"&&e.contactSubject.trim()?e.contactSubject.trim():"DevPayr License Issue",n=typeof e?.contactBody=="string"&&e.contactBody.trim()?e.contactBody.trim():`Hi,

I\u2019m seeing an "Unlicensed Software" message in the app.

Domain: ${D()}

Please assist.
`,r=new URLSearchParams;return o&&r.set("subject",o),n&&r.set("body",n),`mailto:${t}?${r.toString()}`}function D(){try{return window.location?.host?String(window.location.host):""}catch{return""}}function S(e){let o=new TextEncoder().encode(e);return crypto.subtle.digest("SHA-256",o).then(n=>Array.from(new Uint8Array(n)).map(r=>r.toString(16).padStart(2,"0")).join(""))}})();
