import { STATUS_MAPPINGS, TYPE_MAPPINGS, TYPE_COLORS } from './config.js';

const NO_IMAGE_URL = 'https://via.placeholder.com/300x400?text=Нет+изображения';

// Маппинг источников на русский
const SOURCE_MAPPINGS = {
    'Manga': 'Манга',
    'Light novel': 'Ранобэ',
    'Visual novel': 'Визуальная новелла',
    'Original': 'Оригинал',
    'Book': 'Книга',
    'Card game': 'Карточная игра',
    'Game': 'Игра',
    'Music': 'Музыка',
    'Novel': 'Новелла',
    'Radio': 'Радио',
    'Web manga': 'Веб-манга',
    '4-koma manga': '4-кома манга',
    'Other': 'Другое',
    'Unknown': 'Неизвестно'
};

export function getAnimeImage(anime) {
    return anime.coverImage || anime.bannerImage || NO_IMAGE_URL;
}

export function renderAnime(animeList, container) {
    if (!container) return;

    if (!animeList || animeList.length === 0) {
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-frown"></i>
                <p>Аниме не найдены</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';

    animeList.forEach(anime => {
        const card = document.createElement('div');
        card.className = 'anime-card';

        const statusText = STATUS_MAPPINGS[anime.status] || 'Неизвестно';
        const typeText = TYPE_MAPPINGS[anime.format] || anime.format || 'TV';
        const score = anime.score ? anime.score.toFixed(1) : 'Н/Д';
        const year = anime.year || 'Н/Д';

        const shortTitle = anime.title.length > 30 ? anime.title.substring(0, 30) + '...' : anime.title;
        const genresToShow = anime.genres ? anime.genres.slice(0, 3) : [];

        card.innerHTML = `
            <div class="anime-image">
                <img src="${getAnimeImage(anime)}" alt="${anime.title}" loading="lazy" onerror="this.src='${NO_IMAGE_URL}'">
                <div class="anime-score">
                    <i class="fas fa-star"></i> ${score}
                </div>
                <div class="anime-type" style="background: ${TYPE_COLORS[anime.format] || '#666'}">
                    ${typeText}
                </div>
                <div class="anime-status">
                    ${statusText}
                </div>
            </div>
            <div class="anime-info">
                <h3 class="anime-title" title="${anime.title}">${shortTitle}</h3>
                <div class="anime-details">
                    <span><i class="fas fa-calendar"></i> ${year}</span>
                    ${anime.episodeCount ? `<span><i class="fas fa-tv"></i> ${anime.episodeCount} эп.</span>` : ''}
                </div>
                <div class="anime-genres">
                    ${genresToShow.map(genre => `<span class="genre-tag">${genre}</span>`).join('')}
                </div>
            </div>
        `;

        card.addEventListener('click', () => showAnimeDetails(anime));
        container.appendChild(card);
    });
}

function showAnimeDetails(anime) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';

    const statusText = STATUS_MAPPINGS[anime.status] || 'Неизвестно';
    const typeText = TYPE_MAPPINGS[anime.format] || anime.format || 'TV';
    const score = anime.score ? anime.score.toFixed(1) : 'Н/Д';
    const year = anime.year || 'Н/Д';
    const sourceRu = anime.source ? (SOURCE_MAPPINGS[anime.source] || anime.source) : null;

    modal.innerHTML = `
        <div class="modal-content">
            <button class="modal-close"><i class="fas fa-times"></i></button>
            <div class="modal-image">
                <img src="${getAnimeImage(anime)}" alt="${anime.title}" onerror="this.src='${NO_IMAGE_URL}'">
            </div>
            <div class="modal-info">
                <h2>${anime.title}</h2>
                ${anime.titleEnglish && anime.titleEnglish !== anime.title ? `<p><strong>Англ. название:</strong> ${anime.titleEnglish}</p>` : ''}
                ${anime.titleJapanese ? `<p><strong>Яп. название:</strong> ${anime.titleJapanese}</p>` : ''}
                <div class="modal-details">
                    <span class="modal-badge">${typeText}</span>
                    <span class="modal-badge"><i class="fas fa-star"></i> ${score}</span>
                    <span class="modal-badge"><i class="fas fa-calendar"></i> ${year}</span>
                    <span class="modal-badge">${statusText}</span>
                    ${anime.rank ? `<span class="modal-badge"><i class="fas fa-trophy"></i> Рейтинг: #${anime.rank}</span>` : ''}
                    ${anime.popularity ? `<span class="modal-badge"><i class="fas fa-fire"></i> Популярность: #${anime.popularity}</span>` : ''}
                </div>
                ${anime.episodeCount ? `<p><strong>Эпизодов:</strong> ${anime.episodeCount}</p>` : ''}
                ${anime.episodeDuration && anime.episodeDuration !== 'Unknown' ? `<p><strong>Длительность:</strong> ${anime.episodeDuration}</p>` : ''}
                ${sourceRu ? `<p><strong>Источник:</strong> ${sourceRu}</p>` : ''}
                ${anime.studios && anime.studios.length ? `<p><strong>Студии:</strong> ${anime.studios.join(', ')}</p>` : ''}
                ${anime.members ? `<p><strong>В списках:</strong> ${anime.members.toLocaleString('ru-RU')} чел.</p>` : ''}
                ${anime.genres && anime.genres.length ? `
                    <div class="modal-genres">
                        <strong>Жанры:</strong>
                        <div style="margin-top: 6px; display: flex; flex-wrap: wrap; gap: 5px;">
                            ${anime.genres.map(genre => `<span class="genre-tag">${genre}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
                <div class="modal-description">
                    <strong>Описание:</strong>
                    <p>${anime.description || 'Описание отсутствует'}</p>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);

    modal.querySelector('.modal-close').addEventListener('click', () => closeModal(modal));
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(modal); });

    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            closeModal(modal);
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);
}

function closeModal(modal) {
    modal.classList.remove('active');
    setTimeout(() => modal.remove(), 300);
}

export function populateYearFilter(selectElement, years) {
    if (!selectElement || !years) return;
    selectElement.innerHTML = '<option value="">Все годы</option>';
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        selectElement.appendChild(option);
    });
}

export function populateGenreFilter(selectElement, genres) {
    if (!selectElement || !genres) return;
    selectElement.innerHTML = '<option value="">Все жанры</option>';
    genres.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre.nameRu;
        option.textContent = genre.nameRu;
        selectElement.appendChild(option);
    });
}

export function updateStats(animeList, totalCount = null) {
    const statsElement = document.getElementById('stats');
    if (!statsElement) return;

    const displayCount = animeList.length;
    const total = totalCount || displayCount;

    const avgScore = animeList.length > 0
        ? (animeList.reduce((sum, a) => sum + (a.score || 0), 0) / animeList.length).toFixed(1)
        : 0;

    const uniqueGenres = new Set();
    animeList.forEach(anime => anime.genres?.forEach(g => uniqueGenres.add(g)));

    statsElement.innerHTML = `
        <i class="fas fa-tv"></i> Показано: ${displayCount} из ${total.toLocaleString('ru-RU')} &nbsp;|&nbsp;
        <i class="fas fa-star"></i> Средний рейтинг: ${avgScore} &nbsp;|&nbsp;
        <i class="fas fa-tags"></i> Жанров на странице: ${uniqueGenres.size}
    `;
}

export function sortAnime(animeList, sortField, sortDirection = 'desc') {
    if (!sortField) return animeList;

    return [...animeList].sort((a, b) => {
        switch (sortField) {
            case 'score': {
                const diff = (a.score || 0) - (b.score || 0);
                return sortDirection === 'asc' ? diff : -diff;
            }
            case 'title': {
                const cmp = a.title.toLowerCase().localeCompare(b.title.toLowerCase(), 'ru');
                return sortDirection === 'asc' ? cmp : -cmp;
            }
            case 'year': {
                const diff = (a.year || 0) - (b.year || 0);
                return sortDirection === 'asc' ? diff : -diff;
            }
            default:
                return 0;
        }
    });
}
