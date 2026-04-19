document.addEventListener("DOMContentLoaded", async () => {
    // SUPABASE CONFIGURATION
    const SUPABASE_URL = 'https://qlvpdukltvmenbfqkaxu.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_qKZ9yLXawfesBidq_CHN3w_DRKGe6xN';
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // TMDB CONFIGURATION
    const TMDB_API_KEY = 'd0c153faeb709eb8deffeece3081d375';
    const TMDB_BASE = 'https://api.themoviedb.org/3';

    // ANILIST CONFIGURATION
    const ANILIST_URL = 'https://graphql.anilist.co';
    const ANILIST_CLIENT_ID = '38950';
    const ANILIST_CLIENT_SECRET = 'gSoLLcyn8ahc1zJKfnLeOuyEbI49J8q9Jv6aNJFl';

    const splashScreen = document.getElementById("splash-screen");
    const introVideo = document.getElementById("intro-video");
    const app = document.getElementById("app");
    const navbar = document.querySelector(".navbar");

    // Handle Intro Video
    if (splashScreen && introVideo) {
        if (sessionStorage.getItem('introPlayed') === 'true') {
            splashScreen.style.display = 'none';
        } else {
            sessionStorage.setItem('introPlayed', 'true');
            const isMobile = window.innerWidth <= 768;
            const videoSrc = isMobile ? 'Assets/Videos/intro_videomobile.mp4' : 'Assets/Videos/intro_videopc.mp4';
            
            introVideo.src = videoSrc;
            introVideo.load();
        
        // Start transition timer
        let introStarted = false;
        const startIntroSequence = () => {
            if (introStarted) return;
            introStarted = true;
            const introTimeout = setTimeout(hideIntro, 7500);
            introVideo.onended = () => {
                clearTimeout(introTimeout);
                hideIntro();
            };
        };

        // Try playing with sound natively
        introVideo.muted = false;
        const playPromise = introVideo.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                // Auto-playing with sound succeeded!
                startIntroSequence();
            }).catch(error => {
                console.log("Autoplay with sound blocked by browser, playing muted.");
                // Fallback: play muted immediately
                introVideo.muted = true;
                introVideo.play();
                startIntroSequence();

                // Unmute on first user interaction
                const unmuteOnInteraction = () => {
                    introVideo.muted = false;
                    console.log("Intro unmuted via user interaction");
                    window.removeEventListener('click', unmuteOnInteraction);
                    window.removeEventListener('keydown', unmuteOnInteraction);
                    window.removeEventListener('touchstart', unmuteOnInteraction);
                };
                window.addEventListener('click', unmuteOnInteraction, { once: true });
                window.addEventListener('keydown', unmuteOnInteraction, { once: true });
                window.addEventListener('touchstart', unmuteOnInteraction, { once: true });
            });
        }
        }
    }
    
    // Auth Check
    const { data: { session } } = await supabase.auth.getSession();
    const coinBadgeText = document.getElementById('coin-balance');
    
    if(!session) {
        window.location.href = 'auth.html';
        return;
    }

    // Load Profile Data
    async function updateProfileUI() {
        try {
            let { data: profile, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
            
            // If profile doesn't exist (unexpected), attempt to create it (or it might be a new user before trigger runs)
            if (error && error.code === 'PGRST116') {
                const { data: newProfile, error: createError } = await supabase.from('profiles').insert([{ id: session.user.id, mv_coins: 0 }]).select().single();
                if (!createError) profile = newProfile;
            } else if (error) {
                throw error;
            }
            
            if(profile) {
                const coins = profile.mv_coins || 0;
                if(coinBadgeText) coinBadgeText.innerText = `${coins} OP`;
                
                const modalBalance = document.getElementById('modal-coin-balance');
                if (modalBalance) modalBalance.innerText = `${coins} OP`;
                
                // Set Profile Name on My OP Page if available
                const myopName = document.querySelector('.myop-name');
                if (myopName) {
                    const displayName = profile.display_name || profile.username || 'OnixCrew Member';
                    myopName.innerHTML = `${displayName} <i class="fa fa-chevron-down" style="font-size: 0.8rem; margin-left: 5px;"></i>`;
                }

                // Sync session in local storage for other parts of the app
                const updatedSession = {
                    ...JSON.parse(localStorage.getItem('pirate_session') || '{}'),
                    user_id: session.user.id,
                    mv_coins: coins,
                    is_subscribed: profile.is_subscribed,
                    subscription_end: profile.subscription_end
                };
                localStorage.setItem('pirate_session', JSON.stringify(updatedSession));
            }
        } catch (err) {
            console.error("Error updating profile UI:", err.message);
        }
    }
    await updateProfileUI();

    // UI ELEMENTS
    const navLinks = {
        home: document.getElementById('nav-home'),
        anime: document.getElementById('nav-anime'),
        tv: document.getElementById('nav-tv'),
        movies: document.getElementById('nav-movies'),
        search: document.getElementById('row-search-container')
    };

    const rows = {
        search: document.getElementById('row-search-container'),
        trending: document.getElementById('row-trending-container'),
        british: document.getElementById('row-british-container'),
        thriller: document.getElementById('row-thriller-container'),
        gems: document.getElementById('row-gems-container'),
        young_adult: document.getElementById('row-young-adult-container'),
        comedy: document.getElementById('row-comedy-container'),
        real_life: document.getElementById('row-real-life-container'),
        crime: document.getElementById('row-crime-dramas-container'),
        comedy_series: document.getElementById('row-comedy-series-container'),
        epic: document.getElementById('row-epic-realms-container'),
        period: document.getElementById('row-period-pieces-container'),
        thriller_mystery: document.getElementById('row-thriller-mystery-series-container'),
        books: document.getElementById('row-books-container'),
        good_laugh: document.getElementById('row-good-laugh-container'),
        romantic_series: document.getElementById('row-romantic-series-container'),
        your_next_watch: document.getElementById('row-your-next-watch-container'),
        my_op_list: document.getElementById('row-my-op-list-container'),
        asian_films: document.getElementById('row-asian-films-container'),
        top10_films: document.getElementById('row-top10-films-container'),
        scifi: document.getElementById('row-scifi-fantasy-container'),
        love_these: document.getElementById('row-love-these-container'),
        kdramas: document.getElementById('row-kdramas-container'),
        crowd_pleasers: document.getElementById('row-crowd-pleasers-container'),
        familiar_fav: document.getElementById('row-familiar-fav-container'),
        top10_series: document.getElementById('row-top10-series-container'),
        romantic_films: document.getElementById('row-romantic-films-container'),
        weekend: document.getElementById('row-weekend-container'),
        european: document.getElementById('row-european-series-container'),
        emotional: document.getElementById('row-emotional-series-container'),
        new_on_netflix: document.getElementById('row-new-on-netflix-container'),
        bingeworthy: document.getElementById('row-bingeworthy-container'),
        blockbuster: document.getElementById('row-blockbuster-container'),
        action_getin: document.getElementById('row-action-getin-container'),
        made_in_india: document.getElementById('row-made-in-india-container'),
        history: document.getElementById('row-history-container')
    };

    function switchView(view) {
        console.log("Switching view to:", view);
        Object.keys(navLinks).forEach(key => {
            if(navLinks[key]) navLinks[key].classList.remove('active');
        });
        if(navLinks[view]) navLinks[view].classList.add('active');

        // Elements
        const newSearchPage = document.getElementById('new-search-page');
        const myOpPage = document.getElementById('my-op-account-page');
        const animeSection = document.getElementById('anime-sections');
        const heroSection = document.getElementById('hero-section');
        const mobileTopNav = document.querySelector('.mobile-top-nav');

        // Reset Display - Hide all by default
        Object.values(rows).forEach(r => { if(r) r.style.display = 'none'; });
        if(heroSection) heroSection.style.display = 'block';
        if(newSearchPage) newSearchPage.style.display = 'none';
        if(myOpPage) myOpPage.style.display = 'none';
        if(animeSection) animeSection.style.display = 'none';

        // Categorical Rows
        const movieKeys = ['trending', 'british', 'thriller', 'comedy', 'real_life', 'books', 'good_laugh', 'asian_films', 'top10_films', 'romantic_films', 'crowd_pleasers', 'new_on_netflix', 'blockbuster', 'action_getin', 'made_in_india', 'love_these'];
        const tvKeys = ['gems', 'young_adult', 'crime', 'comedy_series', 'epic', 'period', 'thriller_mystery', 'romantic_series', 'your_next_watch', 'scifi', 'kdramas', 'familiar_fav', 'top10_series', 'european', 'emotional', 'bingeworthy', 'weekend'];

        if (view === 'home') {
            Object.values(rows).forEach(r => { if(r) r.style.display = 'block'; });
            if(mobileTopNav) mobileTopNav.classList.remove('force-hide');
        } else if (view === 'movies') {
            movieKeys.forEach(k => { if(rows[k]) rows[k].style.display = 'block'; });
            if(rows.history) rows.history.style.display = 'none';
            if(mobileTopNav) mobileTopNav.classList.remove('force-hide');
        } else if (view === 'tv') {
            tvKeys.forEach(k => { if(rows[k]) rows[k].style.display = 'block'; });
            if(rows.history) rows.history.style.display = 'none';
            if(mobileTopNav) mobileTopNav.classList.remove('force-hide');
        } else if (view === 'anime') {
            if(heroSection) heroSection.style.display = 'none';
            if(animeSection) animeSection.style.display = 'block';
            if(mobileTopNav) mobileTopNav.classList.remove('force-hide');
        } else if (view === 'search') {
            if(heroSection) heroSection.style.display = 'none';
            if(newSearchPage) newSearchPage.style.display = 'block';
            if(mobileTopNav) mobileTopNav.classList.add('force-hide'); // Hide on search
            document.getElementById('netflix-search-input')?.focus();
        } else if (view === 'my_op') {
            if(heroSection) heroSection.style.display = 'none';
            if(myOpPage) myOpPage.style.display = 'block';
            if(mobileTopNav) mobileTopNav.classList.add('force-hide'); // Hide on My OP (page has own header)
        }

        if(view !== 'search' && view !== 'my_op') refreshContent(view);
    }

    // Attach Nav Clicks
    Object.keys(navLinks).forEach(key => {
        if(key === 'search') return;
        navLinks[key]?.addEventListener('click', (e) => {
            e.preventDefault();
            switchView(key);
        });
    });

    // Wallet Logic
    const walletModal = document.getElementById('wallet-modal');
    const coinBadge = document.getElementById('coin-badge');
    const closeWallet = document.getElementById('close-wallet');

    if (coinBadge) coinBadge.onclick = () => { if(walletModal) walletModal.style.display = 'flex'; };
    if (closeWallet) closeWallet.onclick = () => { if(walletModal) walletModal.style.display = 'none'; };
    window.onclick = (e) => { if (e.target == walletModal) walletModal.style.display = 'none'; };

    // Daily Check-in
    const checkinBtn = document.getElementById('daily-checkin-btn');
    if (checkinBtn) {
        checkinBtn.onclick = async () => {
            checkinBtn.disabled = true;
            checkinBtn.innerText = 'Claiming...';
            
            const { data, error } = await supabase.rpc('daily_checkin');
            
            checkinBtn.disabled = false;
            checkinBtn.innerHTML = '<i class="fa fa-gift"></i> Daily Check-in (+3 Coins)';
            
            if (error) {
                showToast('❌ Error: ' + error.message);
                console.error('Checkin error:', error);
            } else if (data == true) {
                showToast('✅ +3 OP Coins Claimed!');
                setTimeout(async () => { await updateProfileUI(); }, 800);
            } else {
                showToast('⏰ Already claimed! Come back in 24 hours.');
            }
        };
    }

    // Plans
    document.querySelectorAll('.plan-card').forEach(card => {
        card.onclick = async () => {
            const days = parseInt(card.getAttribute('data-days'));
            const cost = parseInt(card.getAttribute('data-cost'));
            pirateConfirm("Purchase Plan", `Buy ${days} days for ${cost} coins?`, async () => {
                const { data, error } = await supabase.rpc('purchase_subscription_plan', { 
                    plan_days: days, 
                    cost: cost 
                });

                if (error) {
                    showToast('❌ Error: ' + error.message);
                    console.error('Subscription error:', error);
                } else if (data == true) {
                    pirateAlert('✅ Premium Activated!', `You now have ${days} days of premium access.`);
                    await updateProfileUI();
                } else {
                    showToast('❌ Not enough coins! You need ' + cost + ' OP coins.');
                }
            });
        };
    });

    // Logout
    document.getElementById('logout-btn')?.addEventListener('click', async () => {
        pirateConfirm("Sign Out", "Are you sure you want to leave the pirate ship?", async () => {
            await supabase.auth.signOut();
            localStorage.removeItem('pirate_session');
            window.location.reload();
        });
    });

    // ==================================
    // CUSTOM UI HELPERS (NO BROWSER PROMPTS)
    // ==================================
    window.showToast = function(msg) {
        const container = document.getElementById('pirate-toast-container');
        if(!container) return;
        const toast = document.createElement('div');
        toast.className = 'pirate-toast';
        toast.innerHTML = `<i class="fa fa-info-circle" style="color:var(--primary-accent)"></i> ${msg}`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    };

    window.pirateAlert = function(title, msg) {
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

    // ==================================
    // NEW FUNCTIONAL BUTTONS
    // ==================================
    document.getElementById('coin-badge')?.addEventListener('click', () => {
        const modal = document.getElementById('wallet-modal');
        if(modal) {
            modal.classList.remove('wallet-hide-subs'); // Desktop view full
            modal.style.display = 'flex';
        }
    });

    // Mobile Top Nav Controls
    document.getElementById('m-nav-tv')?.addEventListener('click', () => switchView('tv'));
    document.getElementById('m-nav-movies')?.addEventListener('click', () => switchView('movies'));
    document.getElementById('m-nav-anime')?.addEventListener('click', () => switchView('anime'));
    document.getElementById('mobile-search-btn')?.addEventListener('click', () => switchView('search'));

    // Mobile Bottom Nav Logic
    const botNavHome = document.getElementById('bot-nav-home');
    const botNavNews = document.getElementById('bot-nav-news');
    const botNavWallet = document.getElementById('bot-nav-wallet');
    const botNavMyOp = document.getElementById('bot-nav-myop');

    function setActiveBotNav(element) {
        [botNavHome, botNavNews, botNavWallet, botNavMyOp].forEach(el => el && el.classList.remove('active'));
        if(element) element.classList.add('active');
    }

    if(botNavHome) botNavHome.addEventListener('click', () => {
        setActiveBotNav(botNavHome);
        switchView('home');
    });

    if(botNavNews) botNavNews.addEventListener('click', () => {
        setActiveBotNav(botNavNews);
        switchView('home');
    });

    if(botNavWallet) botNavWallet.addEventListener('click', () => {
        // Wallet is just opening modal, keep current active state
        const modal = document.getElementById('wallet-modal');
        if(modal) {
            modal.classList.add('wallet-hide-subs'); // Hide subscriptions on mobile
            modal.style.display = 'flex';
        }
    });

    if(botNavMyOp) botNavMyOp.addEventListener('click', () => {
        setActiveBotNav(botNavMyOp);
        switchView('my_op');
    });

    document.getElementById('terms-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        showToast("Terms of Service is coming soon!");
    });

    document.getElementById('policy-link')?.addEventListener('click', (e) => {
        e.preventDefault();
        showToast("Privacy Policy is coming soon!");
    });

    // Bottom Sheet Logic for My OP (3 Dots Menu)
    const myopMenuBtn = document.getElementById('myop-menu-trigger');
    const myopSheet = document.getElementById('myop-bottom-sheet');
    if (myopMenuBtn && myopSheet) {
        myopMenuBtn.addEventListener('click', () => {
            myopSheet.classList.add('active');
        });
        myopSheet.addEventListener('click', (e) => {
            // Close if clicked on overlay area (not inside the content)
            if(e.target === myopSheet) myopSheet.classList.remove('active');
        });
    }

    // SEARCH LOGIC
    const searchInput = document.getElementById('netflix-search-input');
    const closeSearchBtn = document.getElementById('close-search-btn');
    const recommendedList = document.getElementById('recommended-search-list');
    let searchTimeout;

    if(closeSearchBtn) {
        closeSearchBtn.onclick = () => {
            switchView('home');
            if(searchInput) searchInput.value = '';
        };
    }

    if(searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            if (query.length > 2) {
                searchTimeout = setTimeout(() => {
                    performSearch(query);
                }, 500);
            } else if (query.length === 0) {
                // If empty, reset to initial recommendations
                loadSearchRecommendations();
            }
        });
    }

    async function performSearch(query) {
        if(!recommendedList) return;
        recommendedList.innerHTML = '<p style="color:#888; text-align:center; padding: 20px;">Searching...</p>';
        try {
            const res = await fetch(`${TMDB_BASE}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`);
            const data = await res.json();
            renderSearchVerticalList(data.results);
        } catch(e) {}
    }

    async function loadSearchRecommendations() {
        if(!recommendedList) return;
        try {
            // "Recommended" default
            const res = await fetch(`${TMDB_BASE}/trending/all/day?api_key=${TMDB_API_KEY}`);
            const data = await res.json();
            renderSearchVerticalList(data.results.slice(0, 10)); // Top 10 defaults
        } catch(e) {}
    }

    function renderSearchVerticalList(items) {
        if(!recommendedList) return;
        recommendedList.innerHTML = '';
        if(!items || items.length === 0) {
            recommendedList.innerHTML = '<p style="color:#888; text-align:center; padding: 20px;">No results found.</p>';
            return;
        }

        items.forEach(item => {
            // Media Type filtering
            if(item.media_type !== 'movie' && item.media_type !== 'tv') return;

            const title = item.title || item.name;
            const imgPath = item.backdrop_path || item.poster_path;
            if(!imgPath) return;

            const div = document.createElement('div');
            div.className = 'vert-item';
            div.innerHTML = `
                <img src="https://image.tmdb.org/t/p/w300${imgPath}" alt="${title}" loading="lazy">
                <div class="vert-item-title">${title}</div>
                <div class="vert-item-play"><i class="fa fa-play" style="font-size: 0.8rem; margin-left: 3px;"></i></div>
            `;
            div.onclick = () => { window.location.href = `movie.html?id=${item.id}&type=${item.media_type}`; };
            recommendedList.appendChild(div);
        });
    }

    // Call recommendations once
    loadSearchRecommendations();

    // 2. Content Management
    async function refreshContent(view) {
        if (view === 'home') {
            await loadUserContent();
        }
        
        // Always load these globally based on view
        if (view === 'home' || view === 'movies') {
            fetchRow(`${TMDB_BASE}/trending/movie/week?api_key=${TMDB_API_KEY}`, 'trending-row', 'trending');
            fetchRow(`${TMDB_BASE}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=35`, 'comedy-row', 'comedy');
            fetchRow(`${TMDB_BASE}/discover/movie?api_key=${TMDB_API_KEY}&with_origin_country=GB`, 'british-row', 'british');
            fetchRow(`${TMDB_BASE}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=53`, 'thriller-row', 'thriller');
            fetchRow(`${TMDB_BASE}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=99,36`, 'real-life-row', 'real-life');
            fetchRow(`${TMDB_BASE}/discover/movie?api_key=${TMDB_API_KEY}&with_keywords=818`, 'books-row', 'books');
            fetchRow(`${TMDB_BASE}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=35&sort_by=vote_average.desc`, 'good-laugh-row', 'good-laugh');
            
            // New Added Rows For Movies
            fetchRow(`${TMDB_BASE}/discover/movie?api_key=${TMDB_API_KEY}&with_original_language=ko|ja|zh`, 'asian-films-row', 'asian-films');
            // Mocking top 10 PK today with popular
            fetchRow(`${TMDB_BASE}/movie/popular?api_key=${TMDB_API_KEY}&region=PK`, 'top10-films-row', 'top10-films');
            fetchRow(`${TMDB_BASE}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=10749`, 'romantic-films-row', 'romantic-films');
            fetchRow(`${TMDB_BASE}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=35,10751`, 'crowd-pleasers-row', 'crowd-pleasers');
            fetchRow(`${TMDB_BASE}/movie/now_playing?api_key=${TMDB_API_KEY}`, 'new-on-netflix-row', 'new-on-netflix');
            fetchRow(`${TMDB_BASE}/discover/movie?api_key=${TMDB_API_KEY}&sort_by=revenue.desc`, 'blockbuster-row', 'blockbuster');
            fetchRow(`${TMDB_BASE}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=28`, 'action-getin-row', 'action-getin');
            fetchRow(`${TMDB_BASE}/discover/movie?api_key=${TMDB_API_KEY}&with_origin_country=IN`, 'made-in-india-row', 'made-in-india');
            fetchRow(`${TMDB_BASE}/discover/movie?api_key=${TMDB_API_KEY}`, 'love-these-row', 'love-these');
        }

        if (view === 'home' || view === 'tv') {
            // Trending/Popular TV for Hero when in TV view
            if (view === 'tv') {
                fetch(`${TMDB_BASE}/trending/tv/week?api_key=${TMDB_API_KEY}`)
                    .then(res => res.json())
                    .then(data => { if(data.results) setHero(data.results[0]); });
            }

            fetchRow(`${TMDB_BASE}/discover/tv?api_key=${TMDB_API_KEY}&with_genres=10749,18`, 'romantic-series-row', 'romantic-series');
            fetchRow(`${TMDB_BASE}/discover/tv?api_key=${TMDB_API_KEY}&with_genres=9648,10765`, 'your-next-watch-row', 'your-next-watch');
            fetchRow(`${TMDB_BASE}/discover/tv?api_key=${TMDB_API_KEY}&with_original_language=ko`, 'gems-row', 'gems'); // "Gems for You" -> K-Dramas
            fetchRow(`${TMDB_BASE}/discover/tv?api_key=${TMDB_API_KEY}&with_original_language=ko`, 'kdramas-row', 'kdramas'); // Explicit K-dramas
            fetchRow(`${TMDB_BASE}/discover/tv?api_key=${TMDB_API_KEY}&with_genres=10759,18`, 'young-adult-row', 'young-adult');
            fetchRow(`${TMDB_BASE}/discover/tv?api_key=${TMDB_API_KEY}&with_genres=80`, 'crime-dramas-row', 'crime-dramas');
            fetchRow(`${TMDB_BASE}/discover/tv?api_key=${TMDB_API_KEY}&with_genres=35`, 'comedy-series-row', 'comedy-series');
            fetchRow(`${TMDB_BASE}/discover/tv?api_key=${TMDB_API_KEY}&with_genres=10765`, 'epic-realms-row', 'epic-realms');
            fetchRow(`${TMDB_BASE}/discover/tv?api_key=${TMDB_API_KEY}&with_genres=10768`, 'period-pieces-row', 'period-pieces');
            fetchRow(`${TMDB_BASE}/discover/tv?api_key=${TMDB_API_KEY}&with_genres=9648`, 'thriller-mystery-series-row', 'thriller-mystery-series');
            
            // New Added Rows For TV
            fetchRow(`${TMDB_BASE}/discover/tv?api_key=${TMDB_API_KEY}&with_genres=10765`, 'scifi-fantasy-row', 'scifi-fantasy');
            fetchRow(`${TMDB_BASE}/tv/popular?api_key=${TMDB_API_KEY}`, 'familiar-fav-row', 'familiar-fav');
            fetchRow(`${TMDB_BASE}/tv/popular?api_key=${TMDB_API_KEY}&region=PK`, 'top10-series-row', 'top10-series');
            fetchRow(`${TMDB_BASE}/discover/tv?api_key=${TMDB_API_KEY}&with_origin_country=GB|FR|ES|DE`, 'european-series-row', 'european-series');
            fetchRow(`${TMDB_BASE}/discover/tv?api_key=${TMDB_API_KEY}&with_genres=18`, 'emotional-series-row', 'emotional-series');
            fetchRow(`${TMDB_BASE}/tv/top_rated?api_key=${TMDB_API_KEY}`, 'bingeworthy-row', 'bingeworthy');
            fetchRow(`${TMDB_BASE}/discover/tv?api_key=${TMDB_API_KEY}&with_networks=213`, 'weekend-row', 'weekend'); // e.g. Netflix network
        }

        if (view === 'my_op') {
            await loadUserContent(); // load the lists
        }

        if (view === 'anime') {
            fetchAnilistTrending();
            fetchRow(`${TMDB_BASE}/discover/tv?api_key=${TMDB_API_KEY}&with_genres=16&with_keywords=210024|222243`, 'anime-hindi-row', 'anime-hindi');
            fetchRow(`${TMDB_BASE}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=16&with_keywords=210024`, 'anime-popular-row', 'anime-popular');
        }
    }

    async function fetchAnilistTrending() {
        const query = `
        query {
            Page(page: 1, perPage: 20) {
                media(type: ANIME, sort: TRENDING_DESC) {
                    id
                    idMal
                    title { english native romper }
                    coverImage { extraLarge large }
                    bannerImage
                    description
                }
            }
        }`;
        
        try {
            const res = await fetch(ANILIST_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ query })
            });
            const { data } = await res.json();
            if (data?.Page?.media) {
                const container = document.getElementById('anime-trending-row');
                if(!container) return;
                container.innerHTML = '';
                data.Page.media.forEach(item => {
                    const slide = document.createElement('div');
                    slide.className = 'swiper-slide poster-card tv-focusable';
                    const imgUrl = item.coverImage.extraLarge || item.coverImage.large;
                    slide.innerHTML = `<img src="${imgUrl}" alt="${item.title.english || item.title.native}">`;
                    slide.onclick = () => {
                        window.location.href = `movie.html?id=${item.idMal || item.id}&type=tv&is_anime=true`;
                    };
                    container.appendChild(slide);
                });
                initOrUpdateSwiper('anime-trending');
            }
        } catch(e) { console.error("Anilist Error:", e); }
    }

    async function loadUserContent() {
        const historyContainer = document.getElementById('row-history-container');
        const watchlistContainer = document.getElementById('row-watchlist-container');

        // 1. Load History (Continue Watching)
        const { data: history, error: hError } = await supabase
            .from('history')
            .select('watch_time, last_watched, movies(*)')
            .eq('user_id', session.user.id)
            .order('last_watched', { ascending: false })
            .limit(10);

        if (!hError && history && history.length > 0) {
            historyContainer.style.display = 'block';
            populateUserRow('history-row', history.map(h => h.movies), 'history');
            populateUserRow('trailers-watched-row', history.map(h => h.movies), 'trailers-watched');
        } else {
            historyContainer.style.display = 'none';
        }

        // 2. Load Watchlist
        const { data: watchlist, error: wError } = await supabase
            .from('watchlist')
            .select('movies(*)')
            .eq('user_id', session.user.id)
            .order('added_at', { ascending: false });

        if (!wError && watchlist && watchlist.length > 0) {
            watchlistContainer.style.display = 'block';
            populateUserRow('watchlist-row', watchlist.map(w => w.movies), 'watchlist');
            populateUserRow('myop-list-row', watchlist.map(w => w.movies), 'myop-list');
        } else {
            // Hide Home watchlist if empty
            watchlistContainer.style.display = 'none';
            
            // Show message on My OP page if empty
            const myopListRow = document.getElementById('myop-list-row');
            if (myopListRow) {
                myopListRow.innerHTML = `
                    <div style="padding: 40px 20px; text-align: center; color: #666; width: 100%;">
                        <i class="fa fa-plus-circle" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
                        <p style="font-size: 1.1rem; margin: 0;">Your list is empty.</p>
                        <p style="font-size: 0.9rem; margin-top: 5px;">Click the <b>+ My List</b> button on any movie to add it here!</p>
                    </div>
                `;
                initOrUpdateSwiper('myop-list');
            }
        }
    }

    function populateUserRow(containerId, movies, swiperId) {
        const container = document.getElementById(containerId);
        if(!container) return;
        container.innerHTML = '';
        movies.forEach(movie => {
            if(!movie) return;
            const slide = document.createElement('div');
            slide.className = 'swiper-slide poster-card tv-focusable';
            
            // Fix: Handle inconsistent poster path structures from different joins
            let rawPath = movie.poster_path;
            // If movie comes from a join, it might be nested or have a full path
            let imgUrl = '';
            if (rawPath && !rawPath.startsWith('http')) {
                const cleanPath = rawPath.startsWith('/') ? rawPath : '/' + rawPath;
                imgUrl = `https://image.tmdb.org/t/p/w500${cleanPath}`;
            } else if (rawPath && rawPath.startsWith('http')) {
                imgUrl = rawPath;
            }

            slide.innerHTML = `<img src="${imgUrl || 'https://via.placeholder.com/300x450?text=Loading...'}" alt="${movie.title}" onerror="this.src='https://via.placeholder.com/300x450?text=No+Poster'">`;
            
            if (!rawPath) {
                const type = movie.type || (movie.name ? 'tv' : 'movie');
                fetch(`${TMDB_BASE}/${type}/${movie.tmdb_id || movie.id}?api_key=${TMDB_API_KEY}`)
                .then(res => res.json())
                .then(data => {
                    const freshPath = data.poster_path;
                    if(freshPath) {
                        slide.querySelector('img').src = `https://image.tmdb.org/t/p/w500${freshPath}`;
                        if(supabase && supabase.rpc) {
                            supabase.rpc('upsert_movie', {
                                p_tmdb_id: movie.tmdb_id || movie.id,
                                p_title: movie.title || data.title || data.name,
                                p_poster_path: freshPath,
                                p_type: type
                            }).then(()=>console.log("Auto-healed poster in DB"));
                        }
                    } else {
                        slide.querySelector('img').src = 'https://via.placeholder.com/300x450?text=No+Poster';
                    }
                }).catch(()=>{});
            }
            slide.onclick = () => {
                const type = movie.type || (movie.name ? 'tv' : 'movie');
                window.location.href = `movie.html?id=${movie.tmdb_id || movie.id}&type=${type}`;
            };
            container.appendChild(slide);
        });
        initOrUpdateSwiper(swiperId);
    }

    const swiperInstances = {};

    async function fetchRow(url, containerId, swiperId) {
        try {
            const res = await fetch(url);
            const data = await res.json();
            if (data.results) {
                populateRow(containerId, data.results);
                initOrUpdateSwiper(swiperId);
                if (containerId === 'trending-row' && data.results.length > 0) {
                    setHero(data.results[0]);
                }
            }
        } catch (e) {
            console.error("Error fetching", url, e);
        }
    }

    function populateRow(containerId, items) {
        const container = document.getElementById(containerId);
        if(!container) return;
        container.innerHTML = '';
        items.forEach(item => {
            const slide = document.createElement('div');
            slide.className = 'swiper-slide poster-card tv-focusable';
            const imgUrl = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Poster';
            slide.innerHTML = `<img src="${imgUrl}" alt="${item.title || item.name}" onerror="this.src='https://via.placeholder.com/300x450?text=Error+Loading'">`;
            slide.onclick = () => {
                window.location.href = `movie.html?id=${item.id}&type=${item.name ? 'tv' : 'movie'}`;
            };
            container.appendChild(slide);
        });
    }

    function initOrUpdateSwiper(id) {
        const selector = `.${id}-swiper`;
        if (swiperInstances[id]) {
            swiperInstances[id].update();
        } else {
            if(document.querySelector(selector)) {
                swiperInstances[id] = new Swiper(selector, {
                    slidesPerView: 2,
                    spaceBetween: 10,
                    breakpoints: {
                        640: { slidesPerView: 3 },
                        768: { slidesPerView: 4 },
                        1024: { slidesPerView: 5 },
                        1280: { slidesPerView: 6 }
                    }
                });
            }
        }
    }

    function setHero(item) {
        const titleEl = document.getElementById('hero-title');
        const descEl = document.getElementById('hero-desc');
        const heroEl = document.getElementById('hero-section');
        const playBtn = document.getElementById('hero-play-btn');
        const infoBtn = document.getElementById('hero-info-btn');

        if(titleEl) titleEl.innerText = item.title || item.name;
        if(descEl) descEl.innerText = item.overview;
        if(heroEl) {
            const bg = item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : '';
            heroEl.style.backgroundImage = `url('${bg}')`;
        }
        
        const type = item.name ? 'tv' : 'movie';
        
        const videoContainer = document.getElementById('hero-video-container');
        if (videoContainer) videoContainer.innerHTML = ''; // Clear video container if any
        
        if(playBtn) {
            playBtn.onclick = () => {
                window.location.href = `watch.html?id=${item.id}&type=${type}`;
            };
        }
        if(infoBtn) {
            infoBtn.onclick = () => {
                window.location.href = `movie.html?id=${item.id}&type=${type}`;
            };
        }

        const heroListBtn = document.getElementById('add-list-btn-hero');
        if (heroListBtn) {
            heroListBtn.onclick = async () => {
                heroListBtn.disabled = true;
                try {
                    const { data: mId, error: mError } = await supabase.rpc('upsert_movie', {
                        p_tmdb_id: item.id,
                        p_title: item.title || item.name,
                        p_poster_path: item.poster_path,
                        p_type: type
                    });
                    if (mError) throw mError;

                    const { data: existing } = await supabase.from('watchlist').select('id').eq('user_id', session.user.id).eq('movie_id', mId).single();
                    if (existing) {
                        await supabase.from('watchlist').delete().eq('id', existing.id);
                        heroListBtn.innerHTML = '<i class="fa fa-plus"></i> My List';
                        showToast("Removed from My List");
                    } else {
                        await supabase.from('watchlist').insert({ user_id: session.user.id, movie_id: mId });
                        heroListBtn.innerHTML = '<i class="fa fa-check"></i> Added';
                        showToast("Added to My List");
                    }
                } catch(e) { console.error("Hero List Error:", e); }
                heroListBtn.disabled = false;
            };
            
            // Initial Check
            supabase.from('movies').select('id, watchlist(id)').eq('tmdb_id', item.id).single()
            .then(({data}) => {
                if (data && data.watchlist && data.watchlist.length > 0) {
                    heroListBtn.innerHTML = '<i class="fa fa-check"></i> Added';
                } else {
                    heroListBtn.innerHTML = '<i class="fa fa-plus"></i> My List';
                }
            });
        }
    }

    function hideIntro() {
        if(splashScreen) {
            splashScreen.style.opacity = '0';
            setTimeout(() => {
                splashScreen.style.display = 'none';
                if(app) app.style.display = 'block';
                switchView('home');
            }, 800);
        } else {
            if(app) app.style.display = 'block';
            switchView('home');
        }
    }

    // Falls back to timeout if nothing else works
    // (Already handled in startIntro and playPromise.then)

    // Ensure the app displays immediately on subsequent loads (when Intro is skipped)
    if (sessionStorage.getItem('introPlayed') === 'true') {
        if(app) app.style.display = 'block';
        switchView('home');
    }

    window.addEventListener("scroll", () => {
        if(navbar) {
            if (window.scrollY > 50) navbar.classList.add("scrolled");
            else navbar.classList.remove("scrolled");
        }
    });
});
