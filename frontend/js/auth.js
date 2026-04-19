document.addEventListener('DOMContentLoaded', () => {
    // SUPABASE CONFIGURATION
    // Replace with your actual project details
    const SUPABASE_URL = 'https://qlvpdukltvmenbfqkaxu.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_qKZ9yLXawfesBidq_CHN3w_DRKGe6xN'; 
    
    // Initialize Supabase Client
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // DOM ELEMENTS
    const authMainSection = document.getElementById('auth-main-section');
    const otpSection = document.getElementById('otp-section');
    const confirmPassGroup = document.getElementById('confirm-pass-group');
    const authSubmitBtn = document.getElementById('auth-submit-btn');
    const switchModeLink = document.getElementById('switch-mode-link');
    const switchText = document.getElementById('switch-text');
    const errorMsg = document.getElementById('error-msg');
    
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const displayEmail = document.getElementById('display-email');
    
    const otpFields = document.querySelectorAll('.otp-field');
    const verifyOtpBtn = document.getElementById('verify-otp-btn');

    let isLoginMode = true;

    // 1. SWITCH MODE LOGIC
    switchModeLink.addEventListener('click', (e) => {
        e.preventDefault();
        isLoginMode = !isLoginMode;
        
        if (isLoginMode) {
            authSubmitBtn.innerText = 'Sign In';
            switchText.innerText = 'New to OnixPlay+?';
            switchModeLink.innerText = 'Sign up now';
            confirmPassGroup.style.display = 'none';
        } else {
            authSubmitBtn.innerText = 'Create Account';
            switchText.innerText = 'Already have an account?';
            switchModeLink.innerText = 'Log in here';
            confirmPassGroup.style.display = 'block';
        }
        errorMsg.innerText = '';
    });

    // 2. MAIN SUBMIT (LOG IN OR SIGN UP)
    authSubmitBtn.addEventListener('click', async () => {
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        errorMsg.className = '';
        errorMsg.innerText = '';

        if (!email || !password) {
            errorMsg.innerText = "Please fill in all fields.";
            return;
        }

        if (isLoginMode) {
            // LOGIN FLOW
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) {
                errorMsg.innerText = error.message;
            } else {
                localStorage.setItem('pirate_session', JSON.stringify(data.session));
                window.location.href = 'index.html';
            }
        } else {
            // SIGN UP FLOW
            if (password !== confirmPassword) {
                errorMsg.innerText = "Passwords do not match.";
                return;
            }

            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
            });

            if (error) {
                errorMsg.innerText = error.message;
            } else {
                // Supabase sends OTP/Confirmation link on sign up
                // We show the OTP UI
                displayEmail.innerText = email;
                authMainSection.style.display = 'none';
                otpSection.style.display = 'block';
                errorMsg.className = 'success-msg';
                errorMsg.innerText = "Confirmation code sent!";
                otpFields[0].focus();
            }
        }
    });

    // 3. OTP INPUTS AUTO-FOCUS
    otpFields.forEach((field, index) => {
        field.addEventListener('input', (e) => {
            if (e.target.value.length === 1 && index < otpFields.length - 1) {
                otpFields[index + 1].focus();
            }
        });
        field.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                otpFields[index - 1].focus();
            }
        });
    });

    // 4. VERIFY OTP
    verifyOtpBtn.addEventListener('click', async () => {
        const email = emailInput.value;
        const token = Array.from(otpFields).map(f => f.value).join('');

        if (token.length < 6) {
            errorMsg.innerText = "Please enter the full 6-digit code.";
            return;
        }

        const { data, error } = await supabase.auth.verifyOtp({
            email: email,
            token: token,
            type: 'signup'
        });

        if (error) {
            errorMsg.className = '';
            errorMsg.innerText = error.message;
        } else {
            errorMsg.className = 'success-msg';
            errorMsg.innerText = "Verification successful! Logging you in...";
            localStorage.setItem('pirate_session', JSON.stringify(data.session));
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        }
    });
});
