import { API_BASE_URL } from './config.js';

// Кеш для данных
let cache = {
    anime: null,
    currentPage: 1,
    lastPage: 1
};

// Задержка для соблюдения лимитов API (1 запрос в секунду)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Маппинг жанров с английского на русский
export const GENRE_MAPPING = {
    'Action': 'Экшен',
    'Adventure': 'Приключения',
    'Comedy': 'Комедия',
    'Drama': 'Драма',
    'Fantasy': 'Фэнтези',
    'Horror': 'Ужасы',
    'Mystery': 'Мистика',
    'Romance': 'Романтика',
    'Sci-Fi': 'Научная фантастика',
    'Slice of Life': 'Повседневность',
    'Sports': 'Спорт',
    'Supernatural': 'Сверхъестественное',
    'Thriller': 'Триллер',
    'Psychological': 'Психологическое',
    'Ecchi': 'Эччи',
    'Mecha': 'Меха',
    'Seinen': 'Сэйнэн',
    'Shoujo': 'Сёдзё',
    'Shounen': 'Сёнэн',
    'Josei': 'Дзёсэй',
    'Kids': 'Для детей',
    'Game': 'Игры',
    'Historical': 'Историческое',
    'Military': 'Военное',
    'Music': 'Музыка',
    'Parody': 'Пародия',
    'Samurai': 'Самураи',
    'Space': 'Космос',
    'Vampire': 'Вампиры',
    'Harem': 'Гарем'
};

// Базовая функция запроса
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
                throw new Error('Слишком много запросов. Попробуйте позже.');
            }
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}

// УНИВЕРСАЛЬНАЯ функция для получения аниме со ВСЕМИ фильтрами
export async function fetchAnimeWithAllFilters(page = 1, filters = {}, searchTerm = '') {
    try {
        let url = `${API_BASE_URL}/anime?page=${page}&limit=24&sfw=true`;

        // Если есть поисковый запрос
        if (searchTerm && searchTerm.trim() !== '') {
            url = `${API_BASE_URL}/anime?q=${encodeURIComponent(searchTerm)}&page=${page}&limit=24&sfw=true`;
        } else {
            // Без поиска - сортируем по рейтингу
            url += `&order_by=score&sort=desc`;
        }

        // Фильтр по типу (tv, movie, ova, ona, special)
        if (filters.type && filters.type !== '') {
            url += `&type=${filters.type}`;
        }

        // Фильтр по статусу (airing, complete, upcoming)
        if (filters.status && filters.status !== '') {
            let statusParam = '';
            switch(filters.status) {
                case 'airing':
                    statusParam = 'airing';
                    break;
                case 'completed':
                    statusParam = 'complete';
                    break;
                case 'upcoming':
                    statusParam = 'upcoming';
                    break;
            }
            if (statusParam) {
                url += `&status=${statusParam}`;
            }
        }

        // Фильтр по году
        if (filters.year && filters.year !== '') {
            url += `&start_date=${filters.year}-01-01&end_date=${filters.year}-12-31`;
        }

        // Фильтр по жанру (теперь СЕРВЕРНЫЙ!)
        if (filters.genre && filters.genre !== '') {
            const genreId = await getGenreIdByName(filters.genre);
            if (genreId) {
                url += `&genres=${genreId}`;
            }
        }

        console.log(`Fetching anime with all filters, page ${page}...`, url);

        const data = await jikanFetch(url);

        if (data && data.data) {
            return {
                documents: data.data.map(anime => transformAnimeData(anime)),
                pagination: {
                    currentPage: data.pagination.current_page,
                    lastPage: data.pagination.last_visible_page,
                    total: data.pagination.items.total,
                    perPage: 24
                }
            };
        }

        return { documents: [], pagination: { currentPage: 1, lastPage: 1, total: 0 } };
    } catch (error) {
        console.error('Error in fetchAnimeWithAllFilters:', error);
        throw error;
    }
}

// Получение ID жанра по имени (русскому или английскому)
async function getGenreIdByName(genreName) {
    const genres = await fetchGenres();

    // Ищем по русскому имени
    let genre = genres.find(g => g.nameRu === genreName);

    // Если не нашли, ищем по английскому
    if (!genre) {
        genre = genres.find(g => g.name === genreName);
    }

    return genre ? genre.id : null;
}

// Трансформация данных аниме в единый формат
function transformAnimeData(anime) {
    let status = 'completed';
    if (anime.status === 'Currently Airing' || anime.status === 'airing') {
        status = 'airing';
    } else if (anime.status === 'Not yet aired' || anime.status === 'upcoming') {
        status = 'upcoming';
    }

    let format = 'tv';
    const typeLower = (anime.type || '').toLowerCase();
    if (typeLower === 'movie') format = 'movie';
    else if (typeLower === 'ova') format = 'ova';
    else if (typeLower === 'ona') format = 'ona';
    else if (typeLower === 'special') format = 'special';

    return {
        id: anime.mal_id,
        titles: {
            en: anime.title,
            romaji: anime.title,
            jp: anime.title_japanese
        },
        title: anime.title,
        titleEnglish: anime.title_english,
        titleJapanese: anime.title_japanese,
        description: anime.synopsis || 'Описание отсутствует',
        coverImage: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url,
        bannerImage: anime.trailer?.images?.maximum_image_url || anime.images?.jpg?.image_url,
        year: anime.aired?.prop?.from?.year || new Date().getFullYear(),
        status: status,
        format: format,
        genres: anime.genres?.map(g => g.name) || [],
        score: anime.score || 0,
        scoredBy: anime.scored_by,
        rank: anime.rank,
        popularity: anime.popularity,
        members: anime.members,
        favorites: anime.favorites,
        episodeCount: anime.episodes,
        episodeDuration: anime.duration,
        source: anime.source,
        season: anime.season,
        yearSeason: anime.year,
        studios: anime.studios?.map(s => s.name) || [],
        country: 'Япония'
    };
}

// Получение списка всех жанров (с русскими названиями)
export async function fetchGenres() {
    try {
        const url = `${API_BASE_URL}/genres/anime`;
        const data = await jikanFetch(url);

        if (data && data.data) {
            return data.data.map(genre => ({
                id: genre.mal_id,
                name: genre.name, // английское имя для API
                nameRu: GENRE_MAPPING[genre.name] || genre.name // русское для отображения
            }));
        }
        return [];
    } catch (error) {
        console.error('Error fetching genres:', error);
        return [];
    }
}

// Получение доступных годов
export async function fetchYears() {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= 1970; year--) {
        years.push(year);
    }
    return years;
}

// Получение информации об одном аниме
export async function fetchAnimeById(id) {
    try {
        const url = `${API_BASE_URL}/anime/${id}`;
        const data = await jikanFetch(url);

        if (data && data.data) {
            return transformAnimeData(data.data);
        }
        return null;
    } catch (error) {
        console.error('Error fetching anime by id:', error);
        return null;
    }
}