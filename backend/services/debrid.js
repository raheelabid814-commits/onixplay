/**
 * AllDebrid Service
 * Resolves magnets into direct links
 */
const axios = require('axios');
require('dotenv').config();

const AD_API_KEY = process.env.ALLDEBRID_API_KEY;
const AD_BASE = 'https://api.alldebrid.com/v4';

const AGENT = 'onix-pirate-streamer';

async function resolveMagnet(magnet) {
    try {
        // 1. Add magnet to AllDebrid
        const addUrl = `${AD_BASE}/magnet/upload?agent=${AGENT}&apikey=${AD_API_KEY}&magnets[]=${encodeURIComponent(magnet)}`;
        const { data: uploadData } = await axios.get(addUrl);

        if (uploadData.status !== 'success') {
            throw new Error('AllDebrid upload failed: ' + JSON.stringify(uploadData.error));
        }

        const magnetId = uploadData.data.magnets[0].id;

        // 2. Wait for it to be ready (Instant check)
        const statusUrl = `${AD_BASE}/magnet/status?agent=${AGENT}&apikey=${AD_API_KEY}&id=${magnetId}`;
        const { data: statusData } = await axios.get(statusUrl);

        const magnetStatus = statusData.data.magnets;
        
        // If not ready, we might need to wait or it's not cached
        if (magnetStatus.status !== 'Ready') {
            // For production, you might want to handle non-cached torrents differently
            // Here we assume we want cached ones or we return the download link if it becomes ready
        }

        // 3. Get the links found in the magnet
        const fileLinks = magnetStatus.links;
        if (!fileLinks || fileLinks.length === 0) {
            throw new Error('No links found in magnet');
        }

        // Pick the largest file (usually the movie/episode)
        const bestLink = fileLinks.sort((a, b) => b.size - a.size)[0].link;

        // 4. Unlock the link
        const unlockUrl = `${AD_BASE}/link/unlock?agent=${AGENT}&apikey=${AD_API_KEY}&link=${encodeURIComponent(bestLink)}`;
        const { data: unlockData } = await axios.get(unlockUrl);

        if (unlockData.status !== 'success') {
            throw new Error('AllDebrid unlock failed');
        }

        return {
            streamUrl: unlockData.data.link,
            filename: unlockData.data.filename,
            filesize: unlockData.data.filesize
        };

    } catch (error) {
        console.error('AllDebrid Error:', error.message);
        throw error;
    }
}

module.exports = { resolveMagnet };
