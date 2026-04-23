/**
 * Intelligent Filtering Engine
 * Parses torrent titles and ranks results
 */

const QUALITY_MAP = {
    '2160p': 100,
    '4k': 100,
    '1080p': 80,
    '720p': 60,
    '480p': 40
};

function parseTitle(title) {
    const t = title.toLowerCase();
    
    // Resolution
    let resolution = 'Unknown';
    if (t.includes('2160p') || t.includes('4k')) resolution = '2160p';
    else if (t.includes('1080p')) resolution = '1080p';
    else if (t.includes('720p')) resolution = '720p';
    else if (t.includes('480p')) resolution = '480p';

    // Audio / Languages
    const languages = [];
    if (t.includes('hindi')) languages.push('Hindi');
    if (t.includes('english')) languages.push('English');
    if (t.includes('japanese') || t.includes('multi')) languages.push('Japanese');
    if (t.includes('tamil')) languages.push('Tamil');
    if (t.includes('telugu')) languages.push('Telugu');
    if (t.includes('dual audio') || t.includes('multi audio')) languages.push('Dual');

    // Quality Type
    let type = 'WEB-DL';
    if (t.includes('bluray') || t.includes('brrip')) type = 'BluRay';
    if (t.includes('cam') || t.includes('ts') || t.includes('tc') || t.includes('hdts')) type = 'CAM';

    return { resolution, languages, type };
}

function filterAndRank(results, options) {
    const { quality, audio } = options;

    return results
        .map(res => {
            const parsed = parseTitle(res.title);
            let score = 0;

            // Reject CAM/TS
            if (parsed.type === 'CAM') return null;

            // Quality Match
            if (quality && quality !== 'Auto') {
                if (parsed.resolution === quality) score += 50;
                else if (QUALITY_MAP[parsed.resolution] < QUALITY_MAP[quality]) score -= 20;
            } else {
                // Default to best quality
                score += (QUALITY_MAP[parsed.resolution] || 0) / 2;
            }

            // Audio Match
            if (audio && audio !== 'English') {
                if (parsed.languages.includes(audio)) score += 100;
                if (parsed.languages.includes('Dual')) score += 50;
            }

            // Seeder weight
            score += Math.min(res.seeders, 100) / 10;

            return { ...res, parsed, score };
        })
        .filter(res => res !== null)
        .sort((a, b) => b.score - a.score);
}

module.exports = { parseTitle, filterAndRank };
