const axios = require('axios');
const { getProxy } = require('./proxy');
require('dotenv').config();

const PROWLARR_URL = process.env.PROWLARR_URL;
const PROWLARR_API_KEY = process.env.PROWLARR_API_KEY;

/**
 * Build dynamic search query based on Netflix rules
 */
function buildQuery(item, options) {
    const { title, year, season, episode, type } = item;
    const { quality, audio } = options;

    let query = `${title}`;

    if (type === 'movie') {
        if (year) query += ` ${year}`;
    } else if (type === 'tv' || type === 'anime') {
        if (season && episode) {
            // S01E01 format
            const s = season.toString().padStart(2, '0');
            const e = episode.toString().padStart(2, '0');
            query += ` S${s}E${e}`;
        }
    }

    if (quality && quality !== 'Auto') query += ` ${quality}`;
    if (audio && audio !== 'English' && audio !== 'original') query += ` ${audio}`;

    return query.trim();
}

/**
 * Fetch torrents from Prowlarr
 */
async function searchTorrents(query, categories = [2000, 5000]) {
    try {
        const proxy = await getProxy();
        const config = {
            params: {
                query: query,
                categories: categories.join(','),
                apikey: PROWLARR_API_KEY
            },
            // Apply proxy if available
            ...(proxy ? { proxy: proxy } : {})
        };

        const { data } = await axios.get(`${PROWLARR_URL}/api/v1/search`, config);
        
        return data.map(result => ({
            title: result.title,
            size: result.size,
            seeders: result.seeders,
            magnet: result.magnetUrl || result.downloadUrl,
            indexer: result.indexer,
            infoHash: result.infoHash
        }));
    } catch (error) {
        console.error('Prowlarr Search Error:', error.message);
        return [];
    }
}

module.exports = { buildQuery, searchTorrents };
