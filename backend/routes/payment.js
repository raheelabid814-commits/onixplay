const express = require('express');
const router = express.Router();
const axios = require('axios');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qlvpdukltvmenbfqkaxu.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_qKZ9yLXawfesBidq_CHN3w_DRKGe6xN';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Safepay configuration from env
const SAFEPAY_ENV = process.env.SAFEPAY_ENV || 'sandbox'; 
const SAFEPAY_API_KEY = process.env.SAFEPAY_API_KEY || 'sec_d05c73c3-d2f9-4adf-bd9c-1ae93738148c'; 
const SAFEPAY_WEBHOOK_SECRET = process.env.SAFEPAY_WEBHOOK_SECRET || '4853724018d1a6612f23863ccb9dffdfde2b13c2c27137e5d6e5140e8e6ac356';

const API_BASE_URL = SAFEPAY_ENV === 'sandbox' 
    ? 'https://sandbox.api.getsafepay.com' 
    : 'https://api.getsafepay.com';

// Note: Ensure `app.use('/api/payment/webhook', express.raw({ type: 'application/json' }))` 
// is mounted BEFORE `app.use(express.json())` in server.js.
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
        const signature = req.headers['x-sfp-signature'];
        const payload = req.body; 

        if (!signature || !payload) {
            return res.status(400).send('Missing signature or payload');
        }

        // 1. Verify Signature using HMAC SHA512
        const expectedSignature = crypto
            .createHmac('sha512', SAFEPAY_WEBHOOK_SECRET)
            .update(payload)
            .digest('hex');

        if (signature !== expectedSignature) {
            console.error('Invalid Safepay Webhook Signature!');
            return res.status(400).send('Invalid signature');
        }

        const data = JSON.parse(payload.toString());
        console.log('✅ Valid Safepay Webhook received:', data);

        const tracker = data.tracker;
        const status = data.state; // e.g., 'PAID', 'COMPLETED'
        
        // Log Webhook in Database
        await supabase.from('safepay_webhooks').insert({ tracker, event_type: data.type, payload: data });
        
        if (status === 'PAID' || status === 'COMPLETED') {
             const { data: tx } = await supabase.from('transactions').update({ status: 'paid' }).eq('tracker', tracker).select().single();
             if (tx) {
                 // Try to call purchase_subscription_plan RPC or update profiles directly
                 // We will update profiles directly since they are using anon key (might need RLS changes if anon key fails)
                 const endDate = new Date();
                 endDate.setDate(endDate.getDate() + 30);
                 
                 await supabase.from('profiles').update({
                     is_subscribed: true,
                     subscription_end: endDate
                 }).eq('id', tx.user_id);
             }
             console.log(`💰 Transaction ${tracker} marked as PAID. User subscription activated.`);
        }

        res.status(200).send('Webhook processed successfully');
    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).send('Internal Server Error');
    }
});

// For standard JSON routes, we need to parse JSON. 
// Since webhook uses raw body, we apply express.json() specifically to the routes below.
router.use(express.json());

// 1. Initialize Payment (Create Checkout Link)
router.post('/create-checkout', async (req, res) => {
    try {
        const { userId, plan, amount } = req.body;
        
        if (!userId || !amount) {
            return res.status(400).json({ success: false, message: 'Missing userId or amount' });
        }

        const formattedAmount = parseFloat(amount).toFixed(2);
        const reference = `ORDER-${Date.now()}-${userId.substring(0, 6)}`;

        // Init order with Safepay
        const initResponse = await axios.post(`${API_BASE_URL}/order/v1/init`, {
            client: SAFEPAY_API_KEY,
            amount: parseFloat(formattedAmount),
            currency: 'PKR',
            environment: SAFEPAY_ENV
        });

        if (initResponse.data.status.errors && initResponse.data.status.errors.length > 0) {
            console.error('Safepay Init API Error:', initResponse.data.status.errors);
            return res.status(400).json({ success: false, message: initResponse.data.status.message || 'Error initializing payment' });
        }

        const tracker = initResponse.data.data.token;

        // Insert pending transaction in Supabase
        await supabase.from('transactions').insert({ user_id: userId, tracker, reference, amount: formattedAmount, status: 'pending' });

        // Generate Checkout URL
        // Redirect URL is where the user goes after successful payment
        const redirectUrl = `http://localhost:5500/frontend/payment-success.html`; // Update to your production URL
        const cancelUrl = `http://localhost:5500/frontend/payment-cancel.html`; // Update to your production URL

        const checkoutUrl = `${API_BASE_URL}/checkout/pay?environment=${SAFEPAY_ENV}&tracker=${tracker}&source=custom&redirect_url=${redirectUrl}&cancel_url=${cancelUrl}&order_id=${reference}`;

        res.json({ success: true, checkoutUrl, tracker, reference });

    } catch (error) {
        console.error('Safepay Init Error:', error.response?.data || error.message);
        res.status(500).json({ success: false, message: 'Failed to initialize payment' });
    }
});

module.exports = router;
