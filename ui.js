import { STATUS_MAPPINGS, TYPE_MAPPINGS, TYPE_COLORS } from './config.js';

// Получение изображения аниме с fallback
export function getAnimeImage(anime) {
    if (anime.coverImage) {
        return anime.coverImage;
    }
    if (anime.bannerImage) {
        return anime.bannerImage;
    }
    return 'https://via.placeholder.com/300x400?text=No+Image';
}

// Рендер сетки аниме
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

        const statusText = STATUS_MAPPINGS[anime.status] || anime.status || 'Неизвестно';
        const typeText = TYPE_MAPPINGS[anime.format] || anime.format || 'TV';
        const score = anime.score ? anime.score.toFixed(1) : 'N/A';

        const shortTitle = anime.title.length > 30 ? anime.title.substring(0, 30) + '...' : anime.title;
        const genresToShow = anime.genres ? anime.genres.slice(0, 3) : [];

        card.innerHTML = `
            <div class="anime-image">
                <img src="${getAnimeImage(anime)}" alt="${anime.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x400?text=No+Image'">
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
                    <span><i class="fas fa-calendar"></i> ${anime.year || 'N/A'}</span>
                    ${anime.episodeCount ? `<span><i class="fas fa-tv"></i> ${anime.episodeCount} эп.</span>` : ''}
                </div>
                <div class="anime-genres">
                    ${genresToShow.map(genre => `<span class="genre-tag">${genre}</span>`).join('')}
                </div>
            </div>
        `;

        card.addEventListener('click', () => {
            showAnimeDetails(anime);
        });

        container.appendChild(card);
    });
}

// Показ модального окна с подробной информацией
function showAnimeDetails(anime) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';

    const statusText = STATUS_MAPPINGS[anime.status] || anime.status || 'Неизвестно';
    const typeText = TYPE_MAPPINGS[anime.format] || anime.format || 'TV';
    const score = anime.score ? anime.score.toFixed(1) : 'N/A';

    modal.innerHTML = `
        <div class="modal-content">
            <button class="modal-close"><i class="fas fa-times"></i></button>
            <div class="modal-image">
                <img src="${getAnimeImage(anime)}" alt="${anime.title}">
            </div>
            <div class="modal-info">
                <h2>${anime.title}</h2>
                ${anime.titleEnglish && anime.titleEnglish !== anime.title ? `<p><strong>Англ. название:</strong> ${anime.titleEnglish}</p>` : ''}
                <div class="modal-details">
                    <span class="modal-badge">${typeText}</span>
                    <span class="modal-badge"><i class="fas fa-star"></i> ${score}</span>
                    <span class="modal-badge"><i class="fas fa-calendar"></i> ${anime.year || 'N/A'}</span>
                    <span class="modal-badge">${statusText}</span>
                    ${anime.rank ? `<span class="modal-badge"><i class="fas fa-trophy"></i> Рейтинг: #${anime.rank}</span>` : ''}
                </div>
                ${anime.episodeCount ? `<p><strong>Эпизодов:</strong> ${anime.episodeCount}</p>` : ''}
                ${anime.episodeDuration && anime.episodeDuration !== 'Unknown' ? `<p><strong>Длительность:</strong> ${anime.episodeDuration}</p>` : ''}
                ${anime.source ? `<p><strong>Источник:</strong> ${anime.source}</p>` : ''}
                ${anime.studios && anime.studios.length ? `<p><strong>Студии:</strong> ${anime.studios.join(', ')}</p>` : ''}
                ${anime.genres && anime.genres.length ? `
                    <div class="modal-genres">
                        <strong>Жанры:</strong>
                        ${anime.genres.map(genre => `<span class="genre-tag">${genre}</span>`).join('')}
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

    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        }
    });

    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);
}

// Заполнение фильтра годов
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

// Заполнение фильтра жанров (с русскими названиями)
export function populateGenreFilter(selectElement, genres) {
    if (!selectElement || !genres) return;

    selectElement.innerHTML = '<option value="">Все жанры</option>';
    genres.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre.nameRu; // Используем русское название для value
        option.textContent = genre.nameRu; // Отображаем русское название
        selectElement.appendChild(option);
    });
}

// Обновление статистики
export function updateStats(animeList, totalCount = null) {
    const statsElement = document.getElementById('stats');
    if (!statsElement) return;

    const displayCount = animeList.length;
    const total = totalCount || displayCount;

    const avgScore = animeList.length > 0
        ? (animeList.reduce((sum, a) => sum + (a.score || 0), 0) / animeList.length).toFixed(1)
        : 0;

    const uniqueGenres = new Set();
    animeList.forEach(anime => {
        if (anime.genres) {
            anime.genres.forEach(g => uniqueGenres.add(g));
        }
    });

    statsElement.innerHTML = `
        <i class="fas fa-tv"></i> Показано: ${displayCount} из ${total} |
        <i class="fas fa-star"></i> Средний рейтинг: ${avgScore} |
        <i class="fas fa-tags"></i> Жанров: ${uniqueGenres.size}
    `;
}

// Сортировка аниме
export function sortAnime(animeList, sortField, sortDirection = 'desc') {
    if (!sortField) return animeList;

    return [...animeList].sort((a, b) => {
        let valueA, valueB;

        switch (sortField) {
            case 'score':
                valueA = a.score || 0;
                valueB = b.score || 0;
                break;
            case 'title':
                valueA = a.title.toLowerCase();
                valueB = b.title.toLowerCase();
                return sortDirection === 'asc'
                    ? valueA.localeCompare(valueB)
                    : valueB.localeCompare(valueA);
            case 'year':
                valueA = a.year || 0;
                valueB = b.year || 0;
                break;
            default:
                return 0;
        }

        if (sortDirection === 'asc') {
            return valueA - valueB;
        } else {
            return valueB - valueA;
        }
    });
}