import { TYPE_COLORS } from './config.js';

const NO_IMAGE_URL = 'https://via.placeholder.com/300x400?text=No+Image';

export function getAnimeImage(anime) {
    return anime.coverImage || anime.bannerImage || NO_IMAGE_URL;
}

export function renderAnime(animeList, container) {
    if (!container) return;

    if (!animeList || animeList.length === 0) {
        container.innerHTML = `
            <div class="error-message">
                <i class="fas fa-frown"></i>
                <p>No anime found</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';

    animeList.forEach(anime => {
        const card = document.createElement('div');
        card.className = 'anime-card';

        const statusText = anime.status === 'airing' ? 'Airing' : (anime.status === 'upcoming' ? 'Upcoming' : 'Completed');
        const typeText = anime.format ? anime.format.toUpperCase() : 'TV';
        const score = anime.score ? anime.score.toFixed(1) : 'N/A';
        const year = anime.year || 'N/A';

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
                    ${anime.episodeCount ? `<span><i class="fas fa-tv"></i> ${anime.episodeCount} eps</span>` : ''}
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

    const statusText = anime.status === 'airing' ? 'Airing' : (anime.status === 'upcoming' ? 'Upcoming' : 'Completed');
    const typeText = anime.format ? anime.format.toUpperCase() : 'TV';
    const score = anime.score ? anime.score.toFixed(1) : 'N/A';
    const year = anime.year || 'N/A';
    const source = anime.source || null;

    modal.innerHTML = `
        <div class="modal-content">
            <button class="modal-close"><i class="fas fa-times"></i></button>
            <div class="modal-image">
                <img src="${getAnimeImage(anime)}" alt="${anime.title}" onerror="this.src='${NO_IMAGE_URL}'">
            </div>
            <div class="modal-info">
                <h2>${anime.title}</h2>
                ${anime.titleEnglish && anime.titleEnglish !== anime.title ? `<p><strong>English title:</strong> ${anime.titleEnglish}</p>` : ''}
                ${anime.titleJapanese ? `<p><strong>Japanese title:</strong> ${anime.titleJapanese}</p>` : ''}
                <div class="modal-details">
                    <span class="modal-badge">${typeText}</span>
                    <span class="modal-badge"><i class="fas fa-star"></i> ${score}</span>
                    <span class="modal-badge"><i class="fas fa-calendar"></i> ${year}</span>
                    <span class="modal-badge">${statusText}</span>
                    ${anime.rank ? `<span class="modal-badge"><i class="fas fa-trophy"></i> Rank: #${anime.rank}</span>` : ''}
                    ${anime.popularity ? `<span class="modal-badge"><i class="fas fa-fire"></i> Popularity: #${anime.popularity}</span>` : ''}
                </div>
                ${anime.episodeCount ? `<p><strong>Episodes:</strong> ${anime.episodeCount}</p>` : ''}
                ${anime.episodeDuration && anime.episodeDuration !== 'Unknown' ? `<p><strong>Duration:</strong> ${anime.episodeDuration}</p>` : ''}
                ${source ? `<p><strong>Source:</strong> ${source}</p>` : ''}
                ${anime.studios && anime.studios.length ? `<p><strong>Studios:</strong> ${anime.studios.join(', ')}</p>` : ''}
                ${anime.members ? `<p><strong>Members:</strong> ${anime.members.toLocaleString()}</p>` : ''}
                ${anime.genres && anime.genres.length ? `
                    <div class="modal-genres">
                        <strong>Genres:</strong>
                        <div style="margin-top: 6px; display: flex; flex-wrap: wrap; gap: 5px;">
                            ${anime.genres.map(genre => `<span class="genre-tag">${genre}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
                <div class="modal-description">
                    <strong>Description:</strong>
                    <p>${anime.description || 'Description missing'}</p>
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
    selectElement.innerHTML = '<option value="">All Years</option>';
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        selectElement.appendChild(option);
    });
}

export function populateGenreFilter(selectElement, genres) {
    if (!selectElement || !genres) return;

    const sortedGenres = [...genres].sort((a, b) => a.name.localeCompare(b.name));

    selectElement.innerHTML = '<option value="">All Genres</option>';
    sortedGenres.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre.name;
        option.textContent = genre.name;
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
        <i class="fas fa-tv"></i> Showing: ${displayCount} of ${total.toLocaleString()} &nbsp;|&nbsp;
        <i class="fas fa-star"></i> Average Score: ${avgScore} &nbsp;|&nbsp;
        <i class="fas fa-tags"></i> Genres on page: ${uniqueGenres.size}
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
                const cmp = a.title.toLowerCase().localeCompare(b.title.toLowerCase());
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