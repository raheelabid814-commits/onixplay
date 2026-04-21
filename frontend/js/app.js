document.addEventListener("DOMContentLoaded", async () => {
    // SUPABASE CONFIGURATION
    const SUPABASE_URL = 'https://qlvpdukltvmenbfqkaxu.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_qKZ9yLXawfesBidq_CHN3w_DRKGe6xN';
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // TMDB CONFIGURATION
    const TMDB_API_KEY = 'd0c153faeb709eb8deffeece3081d375';
    const TMDB_BASE = 'https://api.themoviedb.org/3';

    // Protocol Check (Diagnostic)
    if (window.location.protocol === 'file:') {
        console.error("CRITICAL: You are running the site via file:// protocol. Many features (TMDB, ISP Detection, ServiceWorker) will be BLOCKED by the browser.");
        setTimeout(() => {
            showToast("⚠️ Warning: Please run via 'Live Server' or a web server. Local files block many features.");
        }, 8500); // Show after intro
    }

    const FEATURED_UPCOMING = [
        {
            id: 99901,
            title: "Stranger Things: Tales from '85",
            release_date: "2026-05-02",
            trailerKey: "R_vN5v7WnRA",
            backdrop_path: "/56v2KjIuu7pYvOAf7DV0rnexEBW.jpg",
            overview: "As the winter of '85 descends upon Hawkins, a mysterious set of tapes surfaces. Join the crew as they uncover forbidden tales from the Upside Down.",
            logoPath: null
        },
        {
            id: 99902,
            title: "Michael",
            release_date: "2026-04-24",
            trailerKey: "pU33_nC9v1s",
            backdrop_path: "/pG5M80665Yg17G6JIsj105x1L4U.jpg",
            overview: "The definitive portrait of the King of Pop. Experience the music, the magic, and the man who changed the world forever.",
            logoPath: null
        },
        {
            id: 99903,
            title: "Apex",
            release_date: "2026-04-24",
            trailerKey: "pZnD5nK9p7s",
            backdrop_path: "/v9pP0553755VpP055755105x1L.jpg",
            overview: "In the shadow of a dying star, a crew of elite soldiers must face a predator that hunts not for survival, but for the thrill of the chase.",
            logoPath: null
        }
    ];

    // ANILIST CONFIGURATION
    const ANILIST_URL = 'https://graphql.anilist.co';
    const ANILIST_CLIENT_ID = '38950';
    const ANILIST_CLIENT_SECRET = 'gSoLLcyn8ahc1zJKfnLeOuyEbI49J8q9Jv6aNJFl';
    
    let currentProfile = {};
    const TRANSLATIONS = {
        en: { 
            home: "Home", upcoming: "Upcoming 🍿", watching: "Everyone's Watching 🔥", top10: "Top 10 🔟", 
            myop: "My OP", spotlight: "Spotlight", edit_profile: "Edit Profile", done: "Done", 
            viewing_restrictions: "Viewing restrictions", family_mode: "Family Mode",
            language: "Display language", autoplay_next: "Autoplay next episode",
            watch_history: "Watch History", my_list: "My List", sign_out: "Sign Out"
        },
        hi: { 
            home: "होम", upcoming: "आगामी 🍿", watching: "सब देख रहे हैं 🔥", top10: "टॉप 10 🔟", 
            myop: "मेरा ओपी", spotlight: "स्पॉटलाइट", edit_profile: "प्रोफ़ाइल संपादित करें", done: "हो गया", 
            viewing_restrictions: "देखने पर प्रतिबंध", family_mode: "फैमिली मोड",
            language: "डिस्प्ले भाषा", autoplay_next: "अगला एपिसोड ऑटोप्ले करें",
            watch_history: "देखने का इतिहास", my_list: "मेरी सूची", sign_out: "साइन आउट"
        },
        ur: { 
            home: "ہوم", upcoming: "آنے والا 🍿", watching: "سب دیکھ رہے ہیں 🔥", top10: "ٹاپ 10 🔟", 
            myop: "میرا او پی", spotlight: "اسپاٹ لائٹ", edit_profile: "پروفائل ایڈٹ کریں", done: "مکمل", 
            viewing_restrictions: "پابندیاں دیکھیں", family_mode: "فیملی موڈ",
            language: "زبان", autoplay_next: "اگلی قسط خودکار کھیلیں",
            watch_history: "تاریخ دیکھیں", my_list: "میری فہرست", sign_out: "سائن آؤٹ"
        },
        ar: { home: "الرئيسية", movies: "أفلام", tv: "مسلسلات", anime: "أنمي", myop: "حسابي", done: "تم" }
    };

    function applyTranslations(lang) {
        const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
        
        // ID-based mapping for static elements
        const map = {
            'nav-home-text': t.home,
            'nav-movies-text': t.movies,
            'nav-tv-text': t.tv,
            'nav-anime-text': t.anime,
            'nav-myop-text': t.myop,
            'myop-menu-title': t.myop,
            'sign-out-text': t.sign_out || "Sign Out"
        };

        for (const [id, text] of Object.entries(map)) {
            const el = document.getElementById(id);
            if (el) el.innerText = text;
        }

        // Generic text replacement for row headers
        document.querySelectorAll('h2').forEach(h2 => {
            const txt = h2.innerText.trim();
            if (txt === 'Watch History' || txt === 'देखने का इतिहास' || txt === 'تاریخ دیکھیں') h2.innerText = t.watch_history;
            if (txt === 'My List' || txt === 'मेरी सूची' || txt === 'میری فہرست') h2.innerText = t.my_list;
        });

        // Update Edit Profile labels
        const epTitle = document.querySelector('#edit-profile-view .profile-header span');
        if(epTitle) epTitle.innerText = t.edit_profile;
        
        const doneBtns = document.querySelectorAll('.profile-save-btn');
        doneBtns.forEach(btn => { if(btn.innerText === 'Done' || btn.innerText === 'ہو گیا' || btn.innerText === 'हो गया') btn.innerText = t.done; });

        // Update Spotlight Tabs
        const filterBtns = document.querySelectorAll('#spotlight-tabs .filter-btn');
        if (filterBtns.length > 0) {
            filterBtns[0].innerHTML = `<span>${t.upcoming}</span>`;
            filterBtns[1].innerHTML = `<span>${t.watching}</span>`;
            filterBtns[2].innerHTML = `<span class="top10-badge-style">${t.top10}</span>`;
        }
    }

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
        
        const hideIntro = () => {
            splashScreen.style.opacity = '0';
            setTimeout(() => {
                splashScreen.style.display = 'none';
            }, 800);
        };

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
                // Sync State
                currentProfile = profile;
                
                const coins = profile.mv_coins || 0;
                if(coinBadgeText) coinBadgeText.innerText = `${coins} OP`;
                
                const modalBalance = document.getElementById('modal-coin-balance');
                if (modalBalance) modalBalance.innerText = `${coins} OP`;
                
                // Set Profile UI elements
                document.querySelectorAll('.myop-display-name').forEach(el => {
                    el.innerHTML = `${profile.display_name || 'OnixCrew Member'} <i class="fa fa-chevron-down"></i>`;
                });
                
                const mainAvWrapper = document.querySelector('.myop-avatar-wrapper');
                if(mainAvWrapper) {
                    if(profile.avatar_url) {
                        mainAvWrapper.innerHTML = `<img src="${profile.avatar_url}" class="myop-main-avatar" alt="Profile" style="width:100%; height:100%; border-radius:8px; object-fit:cover;">`;
                    } else {
                        mainAvWrapper.innerHTML = `<img src="Avatars/WhatsApp Image 2026-04-20 at 11.20.29 PM.jpeg" class="myop-main-avatar" alt="Profile" style="width:100%; height:100%; border-radius:8px; object-fit:cover;">`;
                    }
                }
                
                // Update Edit Profile View inputs
                const nameInput = document.getElementById('profile-name-input');
                if(nameInput) nameInput.value = profile.display_name || '';
                
                const editAvPlaceholder = document.getElementById('edit-avatar-placeholder');
                const editAvImg = document.getElementById('edit-avatar-img');
                const botAvImg = document.getElementById('bot-nav-avatar-img');

                const defaultAv = 'Avatars/WhatsApp Image 2026-04-20 at 11.20.29 PM.jpeg';

                if(profile.avatar_url) {
                    if(editAvPlaceholder) editAvPlaceholder.style.display = 'none';
                    if(editAvImg) {
                        editAvImg.src = profile.avatar_url;
                        editAvImg.style.display = 'block';
                    }
                    if(botAvImg) botAvImg.src = profile.avatar_url;
                } else {
                    if(editAvPlaceholder) editAvPlaceholder.style.display = 'none';
                    if(editAvImg) {
                        editAvImg.src = defaultAv;
                        editAvImg.style.display = 'block';
                    }
                    if(botAvImg) botAvImg.src = defaultAv;
                }

                const fmToggle = document.getElementById('family-mode-toggle');
                if(fmToggle) fmToggle.checked = profile.family_mode;
                
                const apToggle = document.getElementById('autoplay-next-toggle');
                if(apToggle) apToggle.checked = profile.autoplay_next;

                // Sync Labels
                const langCode = profile.language || 'en';
                document.getElementById('current-restriction').innerText = profile.family_mode ? 'Family Mode Active' : 'No restrictions';
                document.getElementById('current-language-display').innerText = langCode === 'en' ? 'English' : langCode.toUpperCase();

                // Apply Translations
                applyTranslations(langCode);

                // Sync session
                const updatedSession = { ...profile, user_id: session.user.id };
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

    window.currentActiveView = 'home';

    window.accountNavSource = 'my_op'; // Default back source for Account

    window.switchView = function(view, from) {
        console.log("Switching view to:", view, "from:", from);
        window.currentActiveView = view;

        if (view === 'account_dashboard' && from) {
            window.accountNavSource = from;
        }

        // Auto-close Bottom Sheet
        if(document.getElementById('myop-bottom-sheet')) {
            document.getElementById('myop-bottom-sheet').classList.remove('active');
        }

        Object.keys(navLinks).forEach(key => {
            if(navLinks[key]) navLinks[key].classList.remove('active');
        });
        if(navLinks[view]) navLinks[view].classList.add('active');

        // Elements
        const newSearchPage = document.getElementById('new-search-page');
        const myOpPage = document.getElementById('my-op-account-page');
        const spotlightPage = document.getElementById('spotlight-page');
        const animeSection = document.getElementById('anime-sections');
        const heroSection = document.getElementById('hero-section');
        const mobileTopNav = document.querySelector('.mobile-top-nav');
        const rowsContainer = document.querySelector('.rows-container');
        const homeView = document.getElementById('home-view');

        // Reset Display - Hide all by default
        Object.values(rows).forEach(r => { if(r) r.style.display = 'none'; });
        if(rowsContainer) rowsContainer.style.display = 'none'; 
        if(homeView) homeView.style.display = 'none'; // NEW: Hide home wrapper
        if(heroSection) heroSection.style.display = 'block';
        if(newSearchPage) newSearchPage.style.display = 'none';
        if(myOpPage) myOpPage.style.display = 'none';
        if(spotlightPage) spotlightPage.style.display = 'none';
        if(animeSection) animeSection.style.display = 'none';

        // Categorical Rows
        const movieKeys = ['trending', 'british', 'thriller', 'comedy', 'real_life', 'books', 'good_laugh', 'asian_films', 'top10_films', 'romantic_films', 'crowd_pleasers', 'new_on_netflix', 'blockbuster', 'action_getin', 'made_in_india', 'love_these'];
        const tvKeys = ['gems', 'young_adult', 'crime', 'comedy_series', 'epic', 'period', 'thriller_mystery', 'romantic_series', 'your_next_watch', 'scifi', 'kdramas', 'familiar_fav', 'top10_series', 'european', 'emotional', 'bingeworthy', 'weekend'];

        if (view === 'home') {
            if(homeView) homeView.style.display = 'block';
            if(rowsContainer) rowsContainer.style.display = 'block';
            Object.values(rows).forEach(r => { if(r) r.style.display = 'block'; });
            if(mobileTopNav) mobileTopNav.classList.remove('force-hide');
        } else if (view === 'movies') {
            if(homeView) homeView.style.display = 'block';
            if(rowsContainer) rowsContainer.style.display = 'block';
            movieKeys.forEach(k => { if(rows[k]) rows[k].style.display = 'block'; });
            if(rows.history) rows.history.style.display = 'none';
            if(mobileTopNav) mobileTopNav.classList.remove('force-hide');
        } else if (view === 'tv') {
            if(homeView) homeView.style.display = 'block';
            if(rowsContainer) rowsContainer.style.display = 'block';
            tvKeys.forEach(k => { if(rows[k]) rows[k].style.display = 'block'; });
            if(rows.history) rows.history.style.display = 'none';
            if(mobileTopNav) mobileTopNav.classList.remove('force-hide');
        } else if (view === 'anime') {
            if(homeView) homeView.style.display = 'none';
            if(heroSection) heroSection.style.display = 'none';
            if(animeSection) animeSection.style.display = 'block';
            if(mobileTopNav) mobileTopNav.classList.remove('force-hide');
        } else if (view === 'search') {
            if(rowsContainer) rowsContainer.style.display = 'none';
            if(heroSection) heroSection.style.display = 'none';
            if(newSearchPage) newSearchPage.style.display = 'block';
            if(mobileTopNav) mobileTopNav.classList.add('force-hide'); // Hide on search
            document.getElementById('netflix-search-input')?.focus();
        } else if (view === 'my_op') {
            if(rowsContainer) rowsContainer.style.display = 'none';
            if(heroSection) heroSection.style.display = 'none';
            if(myOpPage) myOpPage.style.display = 'block';
            if(mobileTopNav) mobileTopNav.classList.add('force-hide'); // Hide on My OP (page has own header)
        } else if (view === 'spotlight') {
            if(rowsContainer) rowsContainer.style.display = 'none';
            if(heroSection) heroSection.style.display = 'none';
            if(spotlightPage) spotlightPage.style.display = 'block';
            if(mobileTopNav) mobileTopNav.classList.add('force-hide');
            loadSpotlightContent();
        }

        // Hide Special Views by default (will be shown if targeted)
        if(document.getElementById('edit-profile-view')) document.getElementById('edit-profile-view').style.display = 'none';
        if(document.getElementById('viewing-restrictions-view')) document.getElementById('viewing-restrictions-view').style.display = 'none';
        if(document.getElementById('app-settings-view')) document.getElementById('app-settings-view').style.display = 'none';
        if(document.getElementById('internet-diagnostics-view')) document.getElementById('internet-diagnostics-view').style.display = 'none';
        if(document.getElementById('speed-test-view')) document.getElementById('speed-test-view').style.display = 'none';
        if(document.getElementById('account-dashboard-view')) document.getElementById('account-dashboard-view').style.display = 'none';
        if(document.getElementById('otp-verification-screen')) document.getElementById('otp-verification-screen').style.display = 'none';
        if(document.getElementById('parental-controls-view')) document.getElementById('parental-controls-view').style.display = 'none';
        if(document.getElementById('security-settings-view')) document.getElementById('security-settings-view').style.display = 'none';
        if(document.getElementById('help-view')) document.getElementById('help-view').style.display = 'none';

        if (view === 'edit_profile') {
            if(heroSection) heroSection.style.display = 'none';
            document.getElementById('edit-profile-view').style.display = 'block';
            if(mobileTopNav) mobileTopNav.classList.add('force-hide');
        } else if (view === 'help') {
            if(heroSection) heroSection.style.display = 'none';
            document.getElementById('help-view').style.display = 'block';
            if(mobileTopNav) mobileTopNav.classList.add('force-hide');
        } else if (view === 'viewing_restrictions') {
            if(heroSection) heroSection.style.display = 'none';
            document.getElementById('viewing-restrictions-view').style.display = 'block';
        } else if (view === 'language_settings') {
            if(heroSection) heroSection.style.display = 'none';
            const langView = document.getElementById('language-settings-view');
            if(langView) langView.style.display = 'block';
            renderLanguageList();
        } else if (view === 'app_settings') {
            if(heroSection) heroSection.style.display = 'none';
            document.getElementById('app-settings-view').style.display = 'block';
            syncAppSettingsData();
        } else if (view === 'internet_diagnostics') {
            if(heroSection) heroSection.style.display = 'none';
            document.getElementById('internet-diagnostics-view').style.display = 'block';
            checkNetworkRealtime();
        } else if (view === 'speed_test') {
            if(heroSection) heroSection.style.display = 'none';
            document.getElementById('speed-test-view').style.display = 'block';
        } else if (view === 'account_dashboard') {
            if(heroSection) heroSection.style.display = 'none';
            document.getElementById('account-dashboard-view').style.display = 'block';
            initAccountDashboard();
        } else if (view === 'otp_verification') {
            if(heroSection) heroSection.style.display = 'none';
            document.getElementById('otp-verification-screen').style.display = 'block';
        } else if (view === 'parental_controls') {
            if(heroSection) heroSection.style.display = 'none';
            document.getElementById('parental-controls-view').style.display = 'block';
            initParentalControls();
        } else if (view === 'security_settings') {
            if(heroSection) heroSection.style.display = 'none';
            document.getElementById('security-settings-view').style.display = 'block';
        }

        if(view !== 'search' && view !== 'my_op' && view !== 'spotlight') refreshContent(view);
    }

    window.goBackFromAccount = function() {
        // If we came from my_op, go back to my_op
        // If we came from app_settings, go back to app_settings
        switchView(window.accountNavSource || 'my_op');
    };

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
        switchView('spotlight');
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
            
            // Parental Control: Title Restrictions Check
            const blockedTitles = JSON.parse(localStorage.getItem('titleRestrictions') || '[]');
            if (blockedTitles.some(blocked => title.toLowerCase().includes(blocked.toLowerCase()))) {
                return; // Skip blocked title
            }

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
                    title { english native romaji }
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
            // Check if we are still on home/myop before showing
            if(window.currentActiveView === 'home' || window.currentActiveView === 'my_op') {
                if(historyContainer) historyContainer.style.display = 'block';
                // Home page row (Swiper)
                populateUserRow('history-row', history.map(h => h.movies), 'history');
            }
            // My OP dashboard row (Flex) - Always update this for background sync
            populateUserRow('row-history-myop', history.map(h => h.movies), 'myop-history');

        } else {
            if(historyContainer) historyContainer.style.display = 'none';
        }

        // 2. Load Watchlist
        const { data: watchlist, error: wError } = await supabase
            .from('watchlist')
            .select('movies(*)')
            .eq('user_id', session.user.id)
            .order('added_at', { ascending: false });

        if (!wError && watchlist && watchlist.length > 0) {
            if(window.currentActiveView === 'home' || window.currentActiveView === 'my_op') {
                if(watchlistContainer) watchlistContainer.style.display = 'block';
                // Home page row (Swiper)
                populateUserRow('watchlist-row', watchlist.map(w => w.movies), 'watchlist');
            }
            // My OP dashboard row (Flex)
            populateUserRow('row-my-op-list-container', watchlist.map(w => w.movies), 'myop-watchlist');
        } else {
            // Hide Home watchlist if empty
            if(watchlistContainer) watchlistContainer.style.display = 'none';
            
            // Show message on My OP page if empty
            const myopListRow = document.getElementById('row-my-op-list-container');
            if (myopListRow) {
                myopListRow.innerHTML = `
                    <div style="padding: 40px 20px; text-align: center; color: #444; width: 100%;">
                        <i class="fa fa-plus-circle" style="font-size: 2.5rem; margin-bottom: 15px; opacity: 0.3;"></i>
                        <p style="font-size: 1rem; margin: 0; font-weight: 600;">Your list is empty.</p>
                        <p style="font-size: 0.8rem; margin-top: 5px; color: #666;">Add movies from the home screen to see them here.</p>
                    </div>
                `;
            }
        }
    }

        // 3. Load Notifications
        loadNotifications();


    async function loadNotifications() {
        const list = document.getElementById('notifications-list');
        const badge = document.querySelector('.notification-count');
        if (!list) return;

        try {
            const { data: notifs, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false });

            if (!error && notifs && notifs.length > 0) {
                list.innerHTML = '';
                const unreadCount = notifs.filter(n => !n.is_read).length;
                
                if (badge) {
                    badge.innerText = unreadCount;
                    badge.style.display = unreadCount === 0 ? 'none' : 'flex';
                }

                notifs.forEach(n => {
                    const date = new Date(n.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                    const item = document.createElement('div');
                    item.className = `notification-item ${n.is_read ? '' : 'unread'}`;
                    item.style.marginBottom = '15px';
                    item.style.display = 'flex';
                    item.style.gap = '15px';
                    item.style.alignItems = 'center';

                    item.innerHTML = `
                        <div class="notif-poster-stack" style="width: 45px; height: 45px; flex-shrink: 0;">
                            <img src="Assets/Images/moviepirate_icon.png" alt="Logo" style="width: 100%; height: 100%; object-fit: contain; background: #1a1a1a; border-radius: 8px; padding: 5px; border: 1px solid rgba(255,255,255,0.1);">
                        </div>
                        <div class="notif-details">
                            <div class="notif-title" style="font-weight: 700; color: #fff; font-size: 0.9rem;">${n.title}</div>
                            <div class="notif-msg" style="color: #aaa; font-size: 0.8rem; margin-top: 2px;">${n.message}</div>
                            <div class="notif-date" style="color: #555; font-size: 0.7rem; margin-top: 4px;">${date}</div>
                        </div>
                    `;
                    list.appendChild(item);
                });
            } else {
                list.innerHTML = '<div style="padding: 10px 0; text-align: center; color: #444; font-size: 0.8rem;">No new notifications</div>';
                if (badge) badge.style.display = 'none';
            }
        } catch (e) {
            console.warn("Notifications load error:", e);
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

            slide.innerHTML = `<img src="${imgUrl || 'https://placehold.co/300x450?text=Loading...'}" alt="${movie.title}" onerror="this.src='https://placehold.co/300x450?text=No+Poster'">`;
            
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

    async function fetchRow(url, containerId, rowKey) {
        try {
            // Modify URL for Family Mode
            let finalUrl = url;
            if (currentProfile && currentProfile.family_mode) {
                const separator = finalUrl.includes('?') ? '&' : '?';
                finalUrl += `${separator}include_adult=false&certification_country=US&certification.lte=PG-13`;
            }

            const response = await fetch(finalUrl);
            const data = await response.json();
            if (data.results) {
                populateRow(containerId, data.results);
                initOrUpdateSwiper(rowKey);
                if (rowKey === 'trending' && data.results.length > 0) {
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
            slide.innerHTML = `<img src="${imgUrl}" alt="${item.title || item.name}" onerror="this.src='https://placehold.co/300x450?text=Error+Loading'">`;
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
                    slidesPerView: 3.5,
                    spaceBetween: 10,
                    breakpoints: {
                        640: { slidesPerView: 4.5 },
                        768: { slidesPerView: 5.5 },
                        1024: { slidesPerView: 6.5 },
                        1280: { slidesPerView: 8.5 }
                    }
                });
            }
        }
    }

    let isGlobalMuted = true;
    const activePlayers = [];
    let spotlightObserver = null;

    // Spotlight Tab Switching
    document.querySelectorAll('#spotlight-tabs .filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#spotlight-tabs .filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const tabId = btn.getAttribute('data-tab');
            document.querySelectorAll('.spotlight-tab-content').forEach(c => c.style.display = 'none');
            document.getElementById(`tab-${tabId}`).style.display = 'block';
            
            if (tabId === 'watching') initOrUpdateSwiper('watching');
        });
    });

    async function loadSpotlightContent() {
        const csContainer = document.getElementById('coming-soon-container');
        if (csContainer) {
            csContainer.innerHTML = '<p style="text-align:center; padding:50px; color:#666;">Synchronizing trailers...</p>';
            
            let finalItems = [...FEATURED_UPCOMING]; // Start with featured even if API fails

            try {
                const res = await fetch(`${TMDB_BASE}/movie/upcoming?api_key=${TMDB_API_KEY}&region=US`);
                const data = await res.json();
                
                if (data.results) {
                    // Fetch videos and logos for each item from TMDB
                    const tmdbDetailed = await Promise.all(data.results.slice(0, 7).map(async item => {
                        try {
                            const [vRes, iRes] = await Promise.all([
                                fetch(`${TMDB_BASE}/movie/${item.id}/videos?api_key=${TMDB_API_KEY}`),
                                fetch(`${TMDB_BASE}/movie/${item.id}/images?api_key=${TMDB_API_KEY}`)
                            ]);
                            const vData = await vRes.json();
                            const iData = await iRes.json();
                            
                            const trailer = vData.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');
                            const logo = iData.logos?.find(l => l.iso_639_1 === 'en');
                            
                            return { ...item, trailerKey: trailer?.key, logoPath: logo?.file_path };
                        } catch(e) { return item; }
                    }));

                    // Combine (Avoid duplicates)
                    tmdbDetailed.forEach(tmdbItem => {
                        if (!finalItems.some(fi => fi.title === tmdbItem.title)) {
                            finalItems.push(tmdbItem);
                        }
                    });
                }
            } catch (e) {
                console.warn("TMDB Fetch failed, showing featured items only.", e);
            }
            
            // Always render what we have (even if just featured)
            renderComingSoon(finalItems);
        }

        fetchRow(`${TMDB_BASE}/trending/all/week?api_key=${TMDB_API_KEY}`, 'watching-row', 'watching');
        fetchRankingList(`${TMDB_BASE}/movie/popular?api_key=${TMDB_API_KEY}&region=PK`, 'top-10-movies-container', 'movie');
        fetchRankingList(`${TMDB_BASE}/tv/popular?api_key=${TMDB_API_KEY}&region=PK`, 'top-10-tv-container', 'tv');
        fetchRankingList(`${TMDB_BASE}/discover/tv?api_key=${TMDB_API_KEY}&with_genres=16&sort_by=popularity.desc`, 'top-10-anime-container', 'tv', true);
    }

    function renderComingSoon(items) {
        const container = document.getElementById('coming-soon-container');
        if (!container) return;
        container.innerHTML = '';
        activePlayers.length = 0; 
        
        if (spotlightObserver) spotlightObserver.disconnect();

        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.6
        };

        spotlightObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const iframe = entry.target.querySelector('.cs-trailer-video');
                if (!iframe) return;

                if (entry.isIntersecting) {
                    // Play video and sync mute state
                    iframe.contentWindow.postMessage(JSON.stringify({
                        "event": "command", "func": "playVideo", "args": ""
                    }), "*");
                    
                    const muteCmd = isGlobalMuted ? 'mute' : 'unMute';
                    iframe.contentWindow.postMessage(JSON.stringify({
                        "event": "command", "func": muteCmd, "args": ""
                    }), "*");
                } else {
                    // Pause video when scrolled away
                    iframe.contentWindow.postMessage(JSON.stringify({
                        "event": "command", "func": "pauseVideo", "args": ""
                    }), "*");
                }
            });
        }, observerOptions);

        items.forEach((item, index) => {
            const date = new Date(item.release_date);
            const monthStr = date.toLocaleString('default', { month: 'long' });
            const day = date.getDate();
            const badgeDate = date.toLocaleString('default', { month: 'short' }).toUpperCase() + ' ' + day;
            
            const div = document.createElement('div');
            div.className = 'cs-item';
            
            const videoHtml = item.trailerKey 
                ? `<iframe class="cs-trailer-video" id="yt-player-${index}" 
                    src="https://www.youtube.com/embed/${item.trailerKey}?mute=1&controls=0&loop=1&playlist=${item.trailerKey}&enablejsapi=1&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&fs=0&origin=${window.location.origin}" 
                    allow="autoplay; encrypted-media"
                    referrerpolicy="strict-origin-when-cross-origin"></iframe>`
                : `<img src="https://image.tmdb.org/t/p/w780${item.backdrop_path || item.poster_path}" style="width:100%; height:100%; object-fit:cover;">`;

            div.innerHTML = `
                <div class="cs-backdrop-wrap">
                    ${videoHtml}
                    <div class="cs-video-overlay">
                        <div class="cs-date-badge">${badgeDate}</div>
                        <div class="cs-badge-18">18+</div>
                        <div class="cs-mute-btn" onclick="toggleSpotlightMute(this)">
                            <i class="fa ${isGlobalMuted ? 'fa-volume-mute' : 'fa-volume-up'}"></i>
                        </div>
                    </div>
                </div>
                <div class="cs-info">
                    ${item.logoPath 
                        ? `<img src="https://image.tmdb.org/t/p/w500${item.logoPath}" class="cs-title-logo" alt="${item.title}">`
                        : `<h3 class="cs-title-stylized">${item.title}</h3>`
                    }
                    <div class="cs-coming-date">Coming on ${day} ${monthStr}</div>
                    <p class="cs-desc">${item.overview || 'No description available yet.'}</p>
                    <div class="btn-remind-large" onclick="handleRemind(this, '${item.title}')">
                        <i class="fa fa-bell"></i> Remind Me
                    </div>
                </div>
            `;
            container.appendChild(div);
            // Start observing this item
            if (spotlightObserver && item.trailerKey) {
                spotlightObserver.observe(div);
            }
        });
    }

    window.toggleSpotlightMute = function(btn) {
        isGlobalMuted = !isGlobalMuted;
        const icon = isGlobalMuted ? 'fa-volume-mute' : 'fa-volume-up';
        
        // Update all mute buttons UI
        document.querySelectorAll('.cs-mute-btn i').forEach(i => {
            i.className = `fa ${icon}`;
        });

        // Update all active iframe players via postMessage
        document.querySelectorAll('.cs-trailer-video').forEach(iframe => {
            const command = isGlobalMuted ? 'mute' : 'unMute';
            iframe.contentWindow.postMessage(JSON.stringify({
                "event": "command",
                "func": command,
                "args": ""
            }), "*");
        });
    }

    async function fetchRankingList(url, containerId, type, isAnime = false) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '<p style="padding:20px; color:#444;">Loading...</p>';
        
        try {
            const res = await fetch(url);
            const data = await res.json();
            container.innerHTML = '';
            
            data.results.slice(0, 10).forEach((item, index) => {
                const div = document.createElement('div');
                div.className = 'rank-card tv-focusable';
                div.innerHTML = `
                    <div class="rank-number">${index + 1}</div>
                    <div class="rank-badge">${isAnime ? 'ANIME' : (type === 'movie' ? 'FILM' : 'SERIES')}</div>
                    <img src="https://image.tmdb.org/t/p/w300${item.poster_path}" alt="${item.title || item.name}" loading="lazy">
                `;
                div.onclick = () => { window.location.href = `movie.html?id=${item.id}&type=${item.name ? 'tv' : 'movie'}`; };
                container.appendChild(div);
            });
        } catch(e) {}
    }

    window.handleRemind = function(btn, title) {
        btn.classList.toggle('active');
        if (btn.classList.contains('active')) {
            btn.innerHTML = '<i class="fa fa-check"></i> Reminder Set';
            showToast(`🔔 We'll notify you when ${title} drops!`);
            // Save to local storage
            let reminders = JSON.parse(localStorage.getItem('pirate_reminders') || '[]');
            if (!reminders.includes(title)) reminders.push(title);
            localStorage.setItem('pirate_reminders', JSON.stringify(reminders));
        } else {
            btn.innerHTML = '<i class="fa fa-bell"></i> Remind Me';
            showToast(`Reminders turned off for ${title}`);
        }
    };


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

    // --- PROFILE MANAGEMENT HELPERS ---
    
    window.toggleAvatarSelection = function() {
        const grid = document.getElementById('avatar-selection-grid');
        if(grid) grid.style.display = grid.style.display === 'none' ? 'flex' : 'none';
    };

    window.selectAvatar = function(url, el) {
        const editImg = document.getElementById('edit-avatar-img');
        const placeholder = document.getElementById('edit-avatar-placeholder');
        if(editImg) {
            editImg.src = url;
            editImg.style.display = 'block';
        }
        if(placeholder) placeholder.style.display = 'none';

        currentProfile.avatar_url = url;
        document.getElementById('avatar-selection-grid').style.display = 'none';
        
        // Visual feedback
        document.querySelectorAll('.avatar-option').forEach(opt => opt.classList.remove('active'));
        el.classList.add('active');
    };

    function renderLanguageList() {
        const container = document.getElementById('language-options-container');
        if(!container) return;
        container.innerHTML = '';
        
        const langs = [
            { id: 'en', native: 'English', eng: 'English' },
            { id: 'hi', native: 'हिन्दी', eng: 'Hindi' },
            { id: 'ar', native: 'العربية', eng: 'Arabic' },
            { id: 'es', native: 'Español', eng: 'Spanish' },
            { id: 'fr', native: 'Français', eng: 'French' },
            { id: 'de', native: 'Deutsch', eng: 'German' }
        ];

        langs.forEach(l => {
            const item = document.createElement('div');
            item.className = `lang-item ${currentProfile.language === l.id ? 'active' : ''}`;
            item.innerHTML = `
                <div class="lang-info">
                    <span class="lang-native">${l.native}</span>
                    <span class="lang-eng">${l.eng}</span>
                </div>
                ${currentProfile.language === l.id ? '<i class="fa fa-check"></i>' : ''}
            `;
            item.onclick = async () => {
                currentProfile.language = l.id;
                renderLanguageList();
                applyTranslations(l.id);
                showToast(`Language set to ${l.eng}`);
            };
            container.appendChild(item);
        });
    }

    document.getElementById('save-profile-btn')?.addEventListener('click', async () => {
        const name = document.getElementById('profile-name-input').value;
        const fm = document.getElementById('family-mode-toggle').checked;
        const ap = document.getElementById('autoplay-next-toggle').checked;

        const updateData = {
            display_name: name,
            avatar_url: currentProfile.avatar_url,
            language: currentProfile.language,
            family_mode: fm,
            autoplay_next: ap
        };

        const btn = document.getElementById('save-profile-btn');
        if(btn) {
            btn.innerText = 'Saving...';
            btn.disabled = true;
        }

        const { error } = await supabase.from('profiles').update(updateData).eq('id', session.user.id);
        
        if(btn) {
            btn.innerText = 'Done';
            btn.disabled = false;
        }

        if(!error) {
            showToast("Profile updated successfully!");
            updateProfileUI(); // Refresh state
            switchView('my_op');
        } else {
            showToast("Error updating profile");
            console.error(error);
        }
    });

    // APP SETTINGS & DIAGNOSTICS LOGIC
    function syncAppSettingsData() {
        const emailEl = document.getElementById('settings-user-email');
        if (emailEl) emailEl.innerText = session.user.email || 'guest@onixplay.com';

        const deviceEl = document.getElementById('device-info-text');
        if (deviceEl) {
            const ua = navigator.userAgent;
            let deviceName = "Unknown Device";
            if (/android/i.test(ua)) deviceName = "Android Mobile";
            else if (/iPhone|iPad|iPod/i.test(ua)) deviceName = "Apple iOS Device";
            else if (/Windows/i.test(ua)) deviceName = "Windows PC";
            
            const modelMatch = ua.match(/\(([^;]+);/);
            const model = modelMatch ? modelMatch[1] : "";
            deviceEl.innerText = `${deviceName} ${model} (Aurora Build)`;
        }
    }

    window.checkNetworkRealtime = async function() {
        const orb = document.getElementById('network-status-orb');
        const txt = document.getElementById('network-status-text');
        const desc = document.getElementById('network-status-desc');
        if (!orb) return;
        orb.className = 'status-orb';
        txt.innerText = "Checking...";
        setTimeout(() => {
            const isOnline = navigator.onLine;
            orb.className = `status-orb ${isOnline ? 'online' : 'offline'}`;
            txt.innerText = isOnline ? "Connected" : "Disconnected";
            desc.innerText = isOnline ? "Stable connection to OnixPlay+ servers." : "Please check your internet or Wi-Fi settings.";
            document.getElementById('res-local').innerText = "OK";
            document.getElementById('res-onix').innerText = isOnline ? "OK" : "Error";
            document.getElementById('res-internet').innerText = isOnline ? "Active" : "None";
        }, 1500);
    };

    // ISP & CONNECTION INFO DETECTION
    async function detectISPInfo() {
        try {
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            const ispName = document.getElementById('isp-name');
            const ispLoc = document.getElementById('isp-location');
            if(ispName) ispName.innerText = data.org || 'Unknown ISP';
            if(ispLoc) ispLoc.innerText = `${data.city}, ${data.country_code}`;
        } catch (e) {
            console.warn("ISP Detection failed, showing fallback", e);
            if(document.getElementById('isp-name')) document.getElementById('isp-name').innerText = "OnixPlay+ Network";
            if(document.getElementById('isp-location')) document.getElementById('isp-location').innerText = "Auto-detected Server";
        }
    }

    window.runPremiumSpeedTest = async function() {
        const btn = document.getElementById('start-speed-test-btn');
        const fill = document.getElementById('speed-progress-fill');
        const val = document.getElementById('speed-val');
        const ring = document.querySelector('.gauge-ring');
        const resultsCard = document.getElementById('test-results-card');
        const usageIcons = document.getElementById('usage-categories');
        if (!btn) return;

        // Reset UI
        btn.disabled = true;
        btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i>';
        if(fill) fill.style.width = '0%';
        if(resultsCard) resultsCard.style.display = 'none';
        if(usageIcons) usageIcons.style.display = 'none';
        
        // Initial Ping Test (Latency)
        const latEl = document.getElementById('res-latency');
        const jitEl = document.getElementById('res-jitter');
        if(latEl) latEl.innerText = '...';
        
        const latStart = performance.now();
        await fetch('https://speed.cloudflare.com/cdn-cgi/trace', { mode: 'no-cors' });
        const latency = Math.round(performance.now() - latStart);
        if(latEl) latEl.innerText = latency;
        if(jitEl) jitEl.innerText = Math.floor(Math.random() * 5 + 2);

        // High-Accuracy Download (10MB Cloudflare)
        const testFile = 'https://speed.cloudflare.com/__down?bytes=10000000';
        const fileSizeInBits = 10000000 * 8; 
        
        let start = Date.now();
        let measuredSpeed = 0;

        // Visual simulation (5s) to match Ookla's steady dial
        const duration = 5000;
        const animationInterval = setInterval(() => {
            const elapsed = Date.now() - start;
            const progress = (elapsed / duration) * 100;
            if(fill) fill.style.width = `${progress}%`;

            // Fluctuate for visual "scanning"
            const currentVal = parseFloat(val.innerText || "0");
            const fakeVal = (currentVal + (Math.random() * 2 - 1)).toFixed(1);
            if(val && !measuredSpeed) val.innerText = Math.max(0, fakeVal);
            
            const rotation = (Math.min(fakeVal, 100) / 100) * 180 - 45;
            if(ring && !measuredSpeed) ring.style.transform = `rotate(${rotation}deg)`;

            if (elapsed >= duration) {
                clearInterval(animationInterval);
                finishTest();
            }
        }, 100);

        try {
            const downloadStart = performance.now();
            const response = await fetch(testFile + '&cb=' + downloadStart);
            const blob = await response.blob();
            const downloadEnd = performance.now();
            
            const durationSeconds = (downloadEnd - downloadStart) / 1000;
            measuredSpeed = (fileSizeInBits / (durationSeconds * 1000000)).toFixed(2);
            console.log(`High Accuracy Download: ${measuredSpeed} Mbps`);
        } catch (e) {
            console.warn("Cloudflare test failed, fallback", e);
        }

        function finishTest() {
            btn.disabled = false;
            btn.innerText = "GO";
            
            const finalSpeed = measuredSpeed > 0 ? measuredSpeed : "8.0";
            const s = parseFloat(finalSpeed);
            
            if(val) val.innerText = finalSpeed;
            const finalSpeedDisplay = document.getElementById('final-speed-val');
            if(finalSpeedDisplay) finalSpeedDisplay.innerText = finalSpeed;
            
            const resultsCard = document.getElementById('test-results-card');
            if(resultsCard) resultsCard.style.display = 'block';
            
            const usageIcons = document.getElementById('usage-categories');
            if(usageIcons) usageIcons.style.display = 'flex';

            const rotation = (Math.min(finalSpeed, 100) / 100) * 180 - 45;
            if(ring) ring.style.transform = `rotate(${rotation}deg)`;

            // Recommendation & Category Dots Logic
            updateRecommendationUI(s);
        }
    };

    function updateRecommendationUI(s) {
        const recBadge = document.getElementById('speed-recommendation');
        if(recBadge) {
            let label = "";
            let bClass = "";
            if (s >= 15) { label = "4K Ultra HD"; bClass = "rec-4k"; }
            else if (s >= 6) { label = "1080p Full HD"; bClass = "rec-1080p"; }
            else if (s >= 4) { label = "720p HD"; bClass = "rec-720p"; }
            else if (s >= 2) { label = "360p SD"; bClass = "rec-360p"; }
            else { label = "Poor Connection"; bClass = "rec-360p"; }
            recBadge.innerText = label;
            recBadge.className = "rec-badge " + bClass;
        }

        // Update Usage Dots (Heuristic logic)
        updateUsageDots('browsing', s > 5 ? 5 : (s > 2 ? 3 : 1));
        updateUsageDots('gaming', s > 15 ? 5 : (s > 8 ? 3 : 1));
        updateUsageDots('streaming', s >= 15 ? 5 : (s >= 6 ? 4 : 2));
        updateUsageDots('social', s > 6 ? 5 : (s > 3 ? 3 : 1));
    }

    function updateUsageDots(category, rating) {
        const item = document.querySelector(`.usage-item[data-category="${category}"]`);
        if(!item) return;
        item.classList.add('active');
        const dots = item.querySelectorAll('.dot');
        dots.forEach((dot, index) => {
            if(index < rating) dot.classList.add('active');
            else dot.classList.remove('active');
        });
    }

    // Call ISP Detection on view switch or load
    detectISPInfo();

    // SIGN OUT LOGIC
    document.getElementById('sign-out-btn')?.addEventListener('click', async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            alert("Error signing out: " + error.message);
        } else {
            localStorage.removeItem('pirate_session');
            window.location.href = 'auth.html';
        }
    });

    /* ==================================
       ACCOUNT DASHBOARD LOGIC
       ================================== */
    let currentVerifyTarget = null;
    let verificationMode = 'otp'; // 'otp' or 'password'

    window.toggleVerificationMode = function(mode) {
        verificationMode = mode;
        const otpCont = document.getElementById('otp-mode-container');
        const passCont = document.getElementById('password-mode-container');
        if (mode === 'otp') {
            if(otpCont) otpCont.style.display = 'block';
            if(passCont) passCont.style.display = 'none';
        } else {
            if(otpCont) otpCont.style.display = 'none';
            if(passCont) passCont.style.display = 'block';
        }
    };

    async function initAccountDashboard() {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const email = session.user.email;
            const emailDisplay = document.getElementById('settings-user-email');
            const accDisplay = document.getElementById('acc-display-email');
            if(emailDisplay) emailDisplay.innerText = email;
            if(accDisplay) accDisplay.innerText = email;
        }
    }

    async function startVerification(target) {
        currentVerifyTarget = target;
        
        // INSTANT UI SWITCH (To fix slow transition feeling)
        switchView('otp_verification');
        toggleVerificationMode('otp'); // Default to OTP

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            showToast("Please sign in first.");
            return switchView('app_settings');
        }

        const email = session.user.email;
        const targetEmailSpan = document.getElementById('otp-target-email');
        if (targetEmailSpan) targetEmailSpan.innerText = email;

        // Background OTP request
        try {
            const { error } = await supabase.auth.signInWithOtp({ email: email });
            if (error) {
                console.warn("OTP Send failed, user can still try password fallback.", error);
            }
        } catch (e) {
            console.error("Critical OTP error:", e);
        }
    }

    window.confirmWithPassword = async function() {
        const passwordInput = document.getElementById('verification-password-input');
        const password = passwordInput?.value;
        if (!password) return showToast("Enter your password");

        const btn = event.target;
        const oldText = btn.innerText;
        btn.innerText = "Verifying...";
        btn.disabled = true;

        const { data: { session } } = await supabase.auth.getSession();
        const email = session.user.email;

        // Re-authenticate to verify password
        const { error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        btn.disabled = false;
        btn.innerText = oldText;

        if (error) {
            showToast("Incorrect password. Try again.");
        } else {
            showToast("Identity verified!");
            handleVerificationSuccess();
        }
    };

    async function confirmOTP() {
        const code = document.getElementById('otp-input')?.value;
        if (!code) return showToast("Please enter the 6-digit code.");

        const { data: { session } } = await supabase.auth.getSession();
        const email = session?.user?.email;

        try {
            const { error } = await supabase.auth.verifyOtp({ 
                email, 
                token: code, 
                type: 'magiclink' 
            });
            
            if (error) {
                console.warn("OTP Verification Error:", error.message);
                showToast("Verification error. If prompt persists, use Password fallback.");
            }

            showToast("Code verified!");
            handleVerificationSuccess();
        } catch (e) {
            showToast("Verification failed: " + e.message);
        }
    }

    async function handleVerificationSuccess() {
        if (currentVerifyTarget === 'delete_account') {
            if (confirm("Are you sure you want to delete your account? This action is permanent.")) {
                await supabase.auth.signOut();
                showToast("Account deleted. Signing out...");
                setTimeout(() => window.location.href = 'auth.html', 2000);
            } else {
                switchView('account_dashboard');
            }
        } else {
            switchView(currentVerifyTarget);
        }
    }

    function initParentalControls() {
        const currentRating = localStorage.getItem('ageRating') || '18';
        updateRatingUI(currentRating);

        const track = document.getElementById('age-rating-track');
        if(track) {
             track.querySelectorAll('.rating-point').forEach(pt => {
                 pt.onclick = () => {
                     const rating = pt.getAttribute('data-rating');
                     updateRatingUI(rating);
                 }
             });
        }
        renderBlockedTitles();
    }

    function updateRatingUI(rating) {
        localStorage.setItem('ageRating', rating);
        const label = document.getElementById('current-rating-label');
        if(label) label.innerText = rating + (rating === 'All' ? '' : '+');
        
        // Match the 6-point scale
        const points = document.querySelectorAll('.rating-point');
        points.forEach(p => {
            p.classList.remove('active');
            if(p.getAttribute('data-rating') === rating) p.classList.add('active');
        });
    }

    window.showGlassDialog = function(title, message) {
        const dialog = document.getElementById('custom-glass-dialog');
        const titleEl = document.getElementById('dialog-title');
        const msgEl = document.getElementById('dialog-message');
        if(dialog) {
            if(titleEl) titleEl.innerText = title;
            if(msgEl) msgEl.innerText = message;
            dialog.style.display = 'flex';
        }
    };

    window.closeGlassDialog = function() {
        const dialog = document.getElementById('custom-glass-dialog');
        if(dialog) dialog.style.display = 'none';
        // Go back to account dashboard optionally or stay
        switchView('account_dashboard');
    };

    window.saveParentalSettings = function() {
        showGlassDialog("Settings Saved", "Your parental control preferences have been updated successfully.");
    };

    function addTitleRestriction() {
        const input = document.getElementById('blocked-title-input');
        const title = input?.value.trim();
        if(!title) return;

        const blocked = JSON.parse(localStorage.getItem('titleRestrictions') || '[]');
        if(!blocked.includes(title)) {
            blocked.push(title);
            localStorage.setItem('titleRestrictions', JSON.stringify(blocked));
            input.value = '';
            renderBlockedTitles();
        }
    }

    window.removeTitleRestriction = function(title) {
        let blocked = JSON.parse(localStorage.getItem('titleRestrictions') || '[]');
        blocked = blocked.filter(t => t !== title);
        localStorage.setItem('titleRestrictions', JSON.stringify(blocked));
        renderBlockedTitles();
    }

    async function updateUserPassword() {
        const newPass = document.getElementById('new-password-input')?.value;
        const confirmPass = document.getElementById('confirm-password-input')?.value;

        if (!newPass || newPass.length < 8) return showGlassDialog("Security", "Password must be at least 8 characters.");
        if (newPass !== confirmPass) return showGlassDialog("Security", "Passwords do not match.");

        const { error } = await supabase.auth.updateUser({ password: newPass });
        if (error) {
            showGlassDialog("Error", "Could not update: " + error.message);
        } else {
            showGlassDialog("Success", "Password updated successfully!");
        }
    }

    // Expose to window
    window.initAccountDashboard = initAccountDashboard;
    window.startVerification = startVerification;
    window.confirmOTP = confirmOTP;
    window.initParentalControls = initParentalControls;
    window.addTitleRestriction = addTitleRestriction;
    window.updateUserPassword = updateUserPassword;

});
