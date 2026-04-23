const axios = require('axios');
require('dotenv').config();

const TMDB_BASE = 'https://api.themoviedb.org/3';
const API_KEY = process.env.TMDB_API_KEY;

/**
 * Fetch official audio languages and details from TMDB
 */
async function getMetadata(id, type) {
    try {
        const url = `${TMDB_BASE}/${type}/${id}?api_key=${API_KEY}&append_to_response=translations`;
        const { data } = await axios.get(url);

        // Extract official languages
        const officialLanguages = data.translations.translations.map(t => ({
            iso: t.iso_639_1,
            name: t.english_name
        }));

        return {
            id: data.id,
            title: data.title || data.name,
            original_title: data.original_title || data.original_name,
            release_date: data.release_date || data.first_air_date,
            year: (data.release_date || data.first_air_date || '').split('-')[0],
            officialLanguages,
            originalLanguage: data.original_language
        };
    } catch (error) {
        console.error('TMDB Metadata Error:', error.message);
        throw new Error('Failed to fetch metadata from TMDB');
    }
}

module.exports = { getMetadata };
