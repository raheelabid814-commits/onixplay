const express = require('express');
const router = express.Router();
const { getMetadata } = require('../services/metadata');
const { buildQuery, searchTorrents } = require('../services/scraper');
const { filterAndRank } = require('../services/filter');
const { resolveMagnet } = require('../services/debrid');

/**
 * @route GET /api/stream
 * @desc  Match foreground expectation for streaming
 */
router.get('/stream', async (req, res) => {
    const { id, title, type, season, episode, quality = '1080p', lang = 'Hindi' } = req.query;

    try {
        let queryTitle = title;
        let year = '';

        // If no title but ID provided, fetch from TMDB
        if (!queryTitle && id) {
            const metadata = await getMetadata(id, type);
            queryTitle = metadata.title;
            year = metadata.year;
        }

        const item = { 
            title: queryTitle, 
            year, 
            season, 
            episode, 
            type: type || 'movie' 
        };
        
        const query = buildQuery(item, { quality, audio: lang });
        const results = await searchTorrents(query);
        const ranked = filterAndRank(results, { quality, audio: lang });

        if (ranked.length === 0) {
            return res.status(404).json({ status: 'error', message: 'No streams found' });
        }

        const bestSource = ranked[0];
        const streamData = await resolveMagnet(bestSource.magnet);

        res.json({
            status: 'success',
            data: {
                url: streamData.streamUrl,
                torrent_name: bestSource.title,
                quality: bestSource.parsed.resolution,
                source: bestSource.indexer
            }
        });

    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

/**
 * @route GET /api/metadata
 * @desc  Return languages and info for the player
 */
router.get('/metadata', async (req, res) => {
    const { id, type } = req.query;
    try {
        const metadata = await getMetadata(id, type);
        res.json({
            status: 'success',
            data: {
                title: metadata.title,
                languages: metadata.officialLanguages.map(l => ({ code: l.iso, name: l.name }))
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

module.exports = router;
