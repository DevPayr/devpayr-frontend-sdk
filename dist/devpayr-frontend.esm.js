(function(){document.readyState==="loading"?document.addEventListener("DOMContentLoaded",d):d();async function d(){let e=f();if(!e){console.warn("[DevPayr] No valid configuration found in global scope.");return}e.debug&&console.log("[DevPayr] Configuration detected:",e);let o=e.license||e.lk;if(!o){console.error("[DevPayr] No license key provided.");return}let t=e.recheck!==!1,i=`devpayr:lastSuccess:${await m(o)}`,c=localStorage.getItem(i);if(c)if(t){if(g(c)){e.debug&&console.log("[DevPayr] Skipping check \u2014 already validated today."),typeof e.onReady=="function"&&e.onReady();return}}else{e.debug&&console.log("[DevPayr] Skipping check \u2014 already validated permanently."),typeof e.onReady=="function"&&e.onReady();return}let l=e.baseUrl||"https://api.devpayr.com/api/v1/",r=new URL("project/has-paid",l);r.searchParams.set("license",o),e.checkType==="check_project"&&r.searchParams.set("action","check_project"),e.injectables&&r.searchParams.set("include","injectables"),fetch(r.toString(),{method:"POST",headers:{accept:"application/json","Content-Type":"application/json","X-Requested-With":"DevPayr-SDK"}}).then(a=>{if(!a.ok)throw new Error("Request failed with status "+a.status);return a.json()}).then(a=>{e.debug&&console.log("[DevPayr] Payment status response:",a);let s=a.data||{};s.has_paid===!0?(localStorage.setItem(i,new Date().toISOString()),typeof e.onReady=="function"&&e.onReady(),e.injectables&&e.injectablesEndpoint&&(Array.isArray(s.injectables)?(e.debug&&console.log("[DevPayr] Using inline injectables from response."),y({injectables:s.injectables},e)):u(o,e,l))):h(e)}).catch(a=>{console.error("[DevPayr] Error during project check or injectables:",a),h(e)})}function f(){let e=Object.keys(window);for(let o of e)try{let t=window[o];if(t&&typeof t=="object"&&(typeof t.license=="string"||typeof t.lk=="string"))return t}catch{}return null}function h(e){(e.invalidBehavior||"redirect")==="modal"?p(e.modalText):window.location.href=e.redirectUrl||"https://devpayr.com/upgrade"}function p(e){let t=f().modalTheme||{},n=t.primary||"#ff4d4d",i=t.background||"#1e1e1e",c=t.text||"#ffffff",l=t.border||n,r=t.glow!==!1,a=e||"The project owner did not pay the developer or is using an unsupported license. This software is unlicensed and potentially pirated.",s=document.createElement("div");s.innerHTML=`
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
                background: ${i};
                border: 2px solid ${l};
                box-shadow: ${r?`0 0 25px ${n}, 0 0 60px ${n}88`:"none"};
                color: ${c};
                padding: 3rem 2rem;
                max-width: 600px;
                width: 90%;
                border-radius: 1rem;
                text-align: center;
                animation: ${r?"pulseGlow 1.5s infinite alternate":"none"};
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
                    ${a}
                </p>

                <a href="mailto:developer@example.com" style="
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
                    Contact Developer
                </a>

                <footer style="font-size: 0.875rem; color: #aaa;">
                    Powered by <a href="https://devpayr.com" target="_blank" rel="noopener noreferrer" style="color: ${c}; text-decoration: underline;">
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
        `,document.body.appendChild(s)}function u(e,o,t){o.debug&&console.log("[DevPayr] Fetching injectables via stream..."),fetch(`${t}injectable/stream`,{method:"POST",headers:{"Content-Type":"application/json","X-Requested-With":"DevPayr-SDK"},body:JSON.stringify({license:e,projectId:o.projectId||null})}).then(n=>{if(!n.ok)throw new Error("Injectable stream failed with status "+n.status);return n.json()}).then(n=>{o.debug&&console.log("[DevPayr] Injectables received:",n),y(n.data,o)}).catch(n=>{console.error("[DevPayr] Failed to fetch injectables:",n)})}function y(e,o){o.injectablesEndpoint&&fetch(o.injectablesEndpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)}).then(t=>{if(!t.ok)throw new Error("Forwarding failed with status "+t.status);o.debug&&console.log("[DevPayr] Injectables sent to backend successfully.")}).catch(t=>{console.error("[DevPayr] Failed to forward injectables to backend:",t)})}function g(e){try{let o=new Date(e),t=new Date;return o.getFullYear()===t.getFullYear()&&o.getMonth()===t.getMonth()&&o.getDate()===t.getDate()}catch{return!1}}function m(e){let t=new TextEncoder().encode(e);return crypto.subtle.digest("SHA-256",t).then(n=>Array.from(new Uint8Array(n)).map(i=>i.toString(16).padStart(2,"0")).join(""))}})();
