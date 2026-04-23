/**
 * Free Proxy Service
 * For scraping when no paid VPN is available
 */
const axios = require('axios');

let cachedProxies = [];
let lastFetch = 0;

async function fetchFreeProxies() {
    // Only fetch every 15 minutes
    if (Date.now() - lastFetch < 15 * 60 * 1000 && cachedProxies.length > 0) {
        return cachedProxies;
    }

    try {
        // Fetching from a public free proxy list (example API)
        const { data } = await axios.get('https://proxylist.geonode.com/api/proxy-list?limit=50&page=1&sort_by=lastChecked&sort_type=desc&protocols=http%2Chttps');
        cachedProxies = data.data.map(p => ({
            host: p.ip,
            port: p.port,
            protocol: p.protocols[0]
        }));
        lastFetch = Date.now();
        console.log(`Fetched ${cachedProxies.length} free proxies`);
        return cachedProxies;
    } catch (e) {
        console.error("Failed to fetch free proxies:", e.message);
        return [];
    }
}

async function getProxy() {
    const proxies = await fetchFreeProxies();
    if (proxies.length === 0) return null;
    
    // Pick a random proxy
    const p = proxies[Math.floor(Math.random() * proxies.length)];
    return {
        protocol: p.protocol,
        host: p.host,
        port: parseInt(p.port)
    };
}

module.exports = { getProxy };
