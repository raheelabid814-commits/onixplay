// Global UI Helpers for OnixPlay+ (No Browser Prompts)
window.showToast = function(msg) {
    let container = document.getElementById('pirate-toast-container');
    if(!container) {
        container = document.createElement('div');
        container.id = 'pirate-toast-container';
        container.style.cssText = 'position:fixed; bottom:30px; left:50%; transform:translateX(-50%); z-index:10000; pointer-events:none;';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'pirate-toast';
    toast.innerHTML = `<i class="fa fa-info-circle" style="color:var(--primary-accent)"></i> ${msg}`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        toast.style.transition = '0.4s ease';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
};

window.pirateAlert = function(title, msg) {
    ensureModalMarkup();
    const overlay = document.getElementById('pirate-modal-overlay');
    document.getElementById('pm-title').innerText = title;
    document.getElementById('pm-message').innerText = msg;
    document.getElementById('pm-cancel').style.display = 'none';
    const confirmBtn = document.getElementById('pm-confirm');
    confirmBtn.innerText = "OK";
    confirmBtn.onclick = () => overlay.style.display = 'none';
    overlay.style.display = 'flex';
};

window.pirateConfirm = function(title, msg, onConfirm) {
    ensureModalMarkup();
    const overlay = document.getElementById('pirate-modal-overlay');
    document.getElementById('pm-title').innerText = title;
    document.getElementById('pm-message').innerText = msg;
    document.getElementById('pm-cancel').style.display = 'inline-block';
    const confirmBtn = document.getElementById('pm-confirm');
    confirmBtn.innerText = "Confirm";
    confirmBtn.onclick = () => {
        overlay.style.display = 'none';
        if(onConfirm) onConfirm();
    };
    document.getElementById('pm-cancel').onclick = () => overlay.style.display = 'none';
    overlay.style.display = 'flex';
};

function ensureModalMarkup() {
    if (document.getElementById('pirate-modal-overlay')) return;
    const markup = `
        <div id="pirate-modal-overlay" class="modal-overlay" style="z-index:10001; display:none; position:fixed; inset:0; background:rgba(0,0,0,0.85); backdrop-filter:blur(10px); justify-content:center; align-items:center;">
            <div class="modal-content" style="max-width:400px; text-align:center; background:#141414; border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:30px;">
                <h2 id="pm-title" style="margin-bottom:15px; color:var(--primary-accent);"></h2>
                <p id="pm-message" style="margin-bottom:25px; color:#ccc;"></p>
                <div style="display:flex; gap:10px; justify-content:center;">
                    <button id="pm-cancel" class="btn btn-info" style="font-size:0.9rem; padding:10px 20px;">Cancel</button>
                    <button id="pm-confirm" class="btn btn-play" style="font-size:0.9rem; padding:10px 20px;">Confirm</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', markup);
}

// ==========================================
// PWA Installation Logic (Mobile & PC only)
// ==========================================
let deferredPrompt;

// Check if device is a Smart TV (basic user-agent check)
function isSmartTV() {
    const ua = navigator.userAgent.toLowerCase();
    return (
        ua.includes('smart-tv') || 
        ua.includes('smarttv') || 
        ua.includes('tizen') || 
        ua.includes('webos') || 
        ua.includes('appletv') || 
        ua.includes('bravia')
    );
}

// Setup Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('ServiceWorker registered'))
            .catch(err => console.log('ServiceWorker registration failed: ', err));
    });
}

// Handle Install Prompt
window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent default Mini-infobar
    e.preventDefault();
    deferredPrompt = e;
    
    // Don't show on TV, and don't show if dismissed recently (using localStorage)
    if (isSmartTV() || localStorage.getItem('pirate_app_install_dismissed') === 'true') {
        return;
    }
    
    showInstallBanner();
});

function showInstallBanner() {
    if (document.getElementById('pwa-install-banner')) return;
    
    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.className = 'pwa-banner';
    banner.innerHTML = `
        <div class="pwa-content" style="display:flex; flex-direction:column; align-items:center; text-align:center; padding: 20px;">
            <img src="Assets/Images/moviepirate_icon.png" alt="Icon" style="width: 100px; height: 100px; margin-bottom: 15px; border-radius: 20px; box-shadow: 0 5px 15px rgba(0,0,0,0.5);">
            <div class="pwa-text">
                <h3 style="margin-bottom: 5px; font-size: 1.2rem;">Install OnixPlay+</h3>
                <p style="font-size: 0.85rem; color: #ccc;">Stream faster, immersive experience without browser tabs.</p>
            </div>
        </div>
        <div class="pwa-actions" style="display:flex; width: 100%; border-top: 1px solid rgba(255,255,255,0.1);">
            <button id="pwa-close-btn" style="flex:1; background:transparent; border:none; padding:15px; color:#fff; font-size:1rem; cursor:pointer; border-right: 1px solid rgba(255,255,255,0.1);">Not Now</button>
            <button id="pwa-install-btn" style="flex:1; background:transparent; border:none; padding:15px; color:var(--primary-accent); font-size:1rem; font-weight:bold; cursor:pointer;">Install App</button>
        </div>
    `;
    document.body.appendChild(banner);
    
    // Trigger animation
    setTimeout(() => banner.classList.add('show'), 100);

    document.getElementById('pwa-install-btn').onclick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            deferredPrompt = null;
        }
        banner.remove();
    };

    document.getElementById('pwa-close-btn').onclick = () => {
        banner.remove();
        // Permanently dismiss - won't show again
        localStorage.setItem('pirate_app_install_dismissed', 'true');
    };
}
