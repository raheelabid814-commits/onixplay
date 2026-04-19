// TV Spatial Navigation functionality for D-Pad / Arrow Keys
document.addEventListener("DOMContentLoaded", () => {
    let focusableElements = [];
    let currentIndex = 0;

    function bindFocusables() {
        // Collect all elements that should be focusable
        focusableElements = Array.from(document.querySelectorAll('.tv-focusable, a, button, .poster-card, .coin-badge'));
        
        // Add class just in case so CSS handles outline
        focusableElements.forEach((el, index) => {
            el.classList.add('tv-focusable');
            el.setAttribute('data-index', index);
        });

        // Focus the first element if nothing is focused
        if(focusableElements.length > 0 && !document.querySelector('.focused')) {
            setFocus(0);
        }
    }

    function setFocus(index) {
        if(index < 0) index = 0;
        if(index >= focusableElements.length) index = focusableElements.length - 1;
        
        focusableElements.forEach(el => el.classList.remove('focused'));
        
        const el = focusableElements[index];
        el.classList.add('focused');
        el.focus();
        
        // Ensure it scrolls into view smoothly (good for TV)
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        currentIndex = index;
    }

    window.addEventListener('keydown', (e) => {
        // Re-bind in case DOM changed
        bindFocusables();
        if(focusableElements.length === 0) return;

        let curEl = focusableElements[currentIndex];
        if(!curEl) {
            setFocus(0);
            return;
        }

        const rect = curEl.getBoundingClientRect();
        
        // Simple directional find nearest logic
        let nextIndex = currentIndex;
        let minDistance = Infinity;

        focusableElements.forEach((el, index) => {
            if(index === currentIndex) return;
            const r = el.getBoundingClientRect();
            
            // Calculate center points
            const cx1 = rect.left + rect.width/2;
            const cy1 = rect.top + rect.height/2;
            const cx2 = r.left + r.width/2;
            const cy2 = r.top + r.height/2;

            const dist = Math.sqrt(Math.pow(cx2 - cx1, 2) + Math.pow(cy2 - cy1, 2));

            // Up
            if(e.key === 'ArrowUp' && cy2 < cy1 && Math.abs(cx1 - cx2) < r.width) {
                if(dist < minDistance) { minDistance = dist; nextIndex = index; }
            }
            // Down
            if(e.key === 'ArrowDown' && cy2 > cy1 && Math.abs(cx1 - cx2) < r.width) {
                if(dist < minDistance) { minDistance = dist; nextIndex = index; }
            }
            // Left
            if(e.key === 'ArrowLeft' && cx2 < cx1 && Math.abs(cy1 - cy2) < r.height) {
                if(dist < minDistance) { minDistance = dist; nextIndex = index; }
            }
            // Right
            if(e.key === 'ArrowRight' && cx2 > cx1 && Math.abs(cy1 - cy2) < r.height) {
                if(dist < minDistance) { minDistance = dist; nextIndex = index; }
            }
        });

        if(nextIndex !== currentIndex) {
            e.preventDefault();
            setFocus(nextIndex);
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault(); // Prevent native scroll
        }

        if(e.key === 'Enter') {
            e.preventDefault();
            curEl.click();
        }
    });

    // Run first bind after a slight delay to allow UI to render (e.g. Swiper)
    setTimeout(bindFocusables, 1000);
});
