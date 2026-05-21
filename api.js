import { API_BASE_URL } from './config.js';

let cache = {
    anime: null,
    currentPage: 1,
    lastPage: 1,
    genres: null
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const EXCLUDED_GENRES = [
    'Avant Garde', 'Boys Love', 'Girls Love', 'Erotica', 'Hentai',
    'Adult Cast', 'Anthropomorphic', 'CGDCT', 'Childcare', 'Combat Sports',
    'Crossdressing', 'Delinquents', 'Educational', 'Gag Humor', 'Harem',
    'Historical', 'Idols (Male)', 'Idols (Female)', 'Iyashikei', 'Love Polygon', 'Magical Sex Shift',
    'Mahou Shoujo', 'Villainess', 'Urban Fantasy', 'Josei', 'Kids', 'Ecchi'
];

async function jikanFetch(url, retryCount = 0) {
    try {
        console.log('Fetching:', url);
        const response = await fetch(url);

        if (response.status === 429) {
            if (retryCount < 3) {
                const waitTime = (retryCount + 1) * 2000;
                console.log(`Rate limited, waiting ${waitTime}ms...`);
                await delay(waitTime);
                return jikanFetch(url, retryCount + 1);
            } else {
                throw new Error('Too many requests. Please try again later.');
            }
        }

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        return await response.json();
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}

export async function fetchAnimeWithAllFilters(page = 1, filters = {}, searchTerm = '', sortField = 'score', sortDirection = 'desc') {
    try {
        const hasSearchTerm = searchTerm && searchTerm.trim() !== '';
        let url;

        if (hasSearchTerm) {
            url = `${API_BASE_URL}/anime?q=${encodeURIComponent(searchTerm)}&page=${page}&limit=24&sfw=true`;
        } else {
            let orderByField = 'score';
            let sortDir = sortDirection;

            if (sortField === 'year') {
                orderByField = 'start_date';
            } else if (sortField === 'score') {
                orderByField = 'score';
            } else if (sortField === 'title') {
                orderByField = 'title';
            } else if (sortField === 'popularity') {
                orderByField = 'popularity';
            } else {
                orderByField = 'score';
            }

            url = `${API_BASE_URL}/anime?page=${page}&limit=24&sfw=true&order_by=${orderByField}&sort=${sortDir}`;
        }

        if (filters.type && filters.type !== '') url += `&type=${filters.type}`;

        if (filters.status && filters.status !== '') {
            const statusMap = { airing: 'airing', completed: 'complete', upcoming: 'upcoming' };
            const s = statusMap[filters.status];
            if (s) url += `&status=${s}`;
        }

        if (filters.year && filters.year !== '') {
            url += `&start_date=${filters.year}-01-01&end_date=${filters.year}-12-31`;
        }

        if (filters.genre && filters.genre !== '') {
            const genreId = await getGenreIdByName(filters.genre);
            if (genreId) url += `&genres=${genreId}`;
        }

        const data = await jikanFetch(url);

        if (data && data.data) {
            let documents = data.data.map(anime => transformAnimeData(anime));

            if (!hasSearchTerm && sortField === 'year') {
                documents = documents.sort((a, b) => {
                    const yearA = a.year || 0;
                    const yearB = b.year || 0;
                    if (sortDirection === 'desc') {
                        return yearB - yearA;
                    } else {
                        return yearA - yearB;
                    }
                });
            }

            return {
                documents: documents,
                pagination: {
                    currentPage: data.pagination.current_page,
                    lastPage: data.pagination.last_visible_page,
                    total: data.pagination.items.total,
                    perPage: 24
                },
                serverSorted: !hasSearchTerm && sortField !== 'year'
            };
        }

        return { documents: [], pagination: { currentPage: 1, lastPage: 1, total: 0 }, serverSorted: false };
    } catch (error) {
        console.error('Error in fetchAnimeWithAllFilters:', error);
        throw error;
    }
}

async function getGenreIdByName(genreName) {
    const genres = await fetchGenres();
    const genre = genres.find(g => g.name === genreName);
    return genre ? genre.id : null;
}

function transformAnimeData(anime) {
    let status = 'completed';
    if (anime.status === 'Currently Airing' || anime.status === 'airing') status = 'airing';
    else if (anime.status === 'Not yet aired' || anime.status === 'upcoming') status = 'upcoming';

    let format = 'tv';
    const typeLower = (anime.type || '').toLowerCase();
    if (typeLower === 'movie') format = 'movie';
    else if (typeLower === 'ova') format = 'ova';
    else if (typeLower === 'ona') format = 'ona';
    else if (typeLower === 'special') format = 'special';

    const filteredGenres = (anime.genres || [])
        .map(g => g.name)
        .filter(genreName => !EXCLUDED_GENRES.includes(genreName));

    return {
        id: anime.mal_id,
        title: anime.title,
        titleEnglish: anime.title_english,
        titleJapanese: anime.title_japanese,
        description: (anime.synopsis || 'Description missing').replace(/\s*\[Written by MAL Rewrite\]\s*$/, ''),
        coverImage: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url,
        bannerImage: anime.trailer?.images?.maximum_image_url || anime.images?.jpg?.image_url,
        year: anime.aired?.prop?.from?.year || 0,
        status,
        format,
        genres: filteredGenres,
        score: anime.score || 0,
        scoredBy: anime.scored_by,
        rank: anime.rank,
        popularity: anime.popularity,
        members: anime.members,
        favorites: anime.favorites,
        episodeCount: anime.episodes,
        episodeDuration: anime.duration,
        source: anime.source,
        studios: anime.studios?.map(s => s.name) || [],
        country: 'Japan'
    };
}

export async function fetchGenres() {
    if (cache.genres) return cache.genres;

    try {
        const data = await jikanFetch(`${API_BASE_URL}/genres/anime`);
        if (data && data.data) {
            cache.genres = data.data
                .filter(genre => !EXCLUDED_GENRES.includes(genre.name))
                .map(genre => ({
                    id: genre.mal_id,
                    name: genre.name
                }));
            return cache.genres;
        }
        return [];
    } catch (error) {
        console.error('Error fetching genres:', error);
        return [];
    }
}

export async function fetchYears() {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= 1970; year--) years.push(year);
    return years;
}

export async function fetchAnimeById(id) {
    try {
        const data = await jikanFetch(`${API_BASE_URL}/anime/${id}`);
        return data?.data ? transformAnimeData(data.data) : null;
    } catch (error) {
        console.error('Error fetching anime by id:', error);
        return null;
    }
}