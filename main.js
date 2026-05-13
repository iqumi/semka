// main.js
import { fetchAnimeWithAllFilters, fetchGenres, fetchYears } from './api.js';
import {
    renderAnime,
    populateYearFilter,
    populateGenreFilter,
    updateStats,
    sortAnime
} from './ui.js';

// Состояние приложения
let allAnime = [];
let currentPage = 1;
let lastPage = 1;
let totalCount = 0;
let currentFilters = {
    status: '',
    type: '',
    year: '',
    genre: ''
};
let currentSearchTerm = '';
let currentSort = { field: 'score', direction: 'desc' };
let username = '';
let isLoading = false;

// Флаг, используется ли серверная сортировка
let useServerSorting = true;

// Инициализация темы
function initializeThemeToggle(themeToggles) {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        themeToggles.forEach(t => {
            t.querySelector('i').className = 'fas fa-sun';
        });
    }

    themeToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            const isDark = document.body.classList.contains('dark-theme');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            themeToggles.forEach(t => {
                t.querySelector('i').className = isDark ? 'fas fa-sun' : 'fas fa-moon';
            });
        });
    });
}

// Обработка ошибки ввода имени
function showInputError(input) {
    input.classList.add('error');
    input.setAttribute('placeholder', 'Пожалуйста, введите ваше имя');
    setTimeout(() => {
        input.classList.remove('error');
        input.setAttribute('placeholder', 'Введите ваше имя');
    }, 2000);
}

// Загрузка данных с API (с серверной сортировкой)
async function loadAnime(page = 1) {
    if (isLoading) return;
    isLoading = true;

    const gridContainer = document.getElementById('anime-grid');
    gridContainer.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i><p>Загрузка аниме...</p></div>';

    try {
        // Передаём параметры сортировки на сервер
        const data = await fetchAnimeWithAllFilters(
            page,
            currentFilters,
            currentSearchTerm,
            currentSort.field,
            currentSort.direction
        );

        if (data && data.documents) {
            allAnime = [...data.documents];
            totalCount = data.pagination.total;
            lastPage = data.pagination.lastPage;
            currentPage = data.pagination.currentPage;
            useServerSorting = data.serverSorted;

            let displayAnime = [...allAnime];

            // Если серверная сортировка НЕ использовалась (поиск), применяем клиентскую
            if (!useServerSorting && currentSort.field) {
                displayAnime = sortAnime(displayAnime, currentSort.field, currentSort.direction);
            }

            renderAnime(displayAnime, gridContainer);
            updateStats(displayAnime, totalCount);
        } else {
            gridContainer.innerHTML = '<div class="error-message"><i class="fas fa-exclamation-triangle"></i><p>Не удалось загрузить данные</p></div>';
        }

        updatePagination();

    } catch (error) {
        console.error('Error loading anime:', error);
        gridContainer.innerHTML = `<div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Ошибка загрузки данных: ${error.message}</p>
            <p>Пожалуйста, попробуйте обновить страницу</p>
        </div>`;
    } finally {
        isLoading = false;
    }
}

// Обновление пагинации
function updatePagination() {
    const pageInfo = document.getElementById('page-info');
    if (pageInfo) {
        pageInfo.textContent = `Страница ${currentPage} из ${lastPage}`;
    }

    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= lastPage;
}

// Загрузка годов и жанров для фильтров
async function loadFilters() {
    const years = await fetchYears();
    const yearFilter = document.getElementById('filter-year');
    populateYearFilter(yearFilter, years);

    const genres = await fetchGenres();
    const genreFilter = document.getElementById('filter-genre');
    populateGenreFilter(genreFilter, genres);
}

// Сброс всех фильтров
async function resetFilters() {
    currentFilters = {
        status: '',
        type: '',
        year: '',
        genre: ''
    };
    currentSearchTerm = '';
    currentSort = { field: 'score', direction: 'desc' };

    document.getElementById('search-input').value = '';
    document.getElementById('filter-status').value = '';
    document.getElementById('filter-type').value = '';
    document.getElementById('filter-year').value = '';
    document.getElementById('filter-genre').value = '';

    currentPage = 1;
    await loadAnime(currentPage);
    updateSortButtonsState();
}

// Обработчик поиска с debounce
let searchTimeout;
function handleSearch(searchTerm) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
        currentSearchTerm = searchTerm;
        currentPage = 1;
        await loadAnime(1);
        updateSortButtonsState();
    }, 500);
}

// Обработчики фильтров
function setupFilters() {
    const filterStatus = document.getElementById('filter-status');
    const filterType = document.getElementById('filter-type');
    const filterYear = document.getElementById('filter-year');
    const filterGenre = document.getElementById('filter-genre');

    const applyFilters = async () => {
        const newFilters = {
            status: filterStatus.value,
            type: filterType.value,
            year: filterYear.value,
            genre: filterGenre.value
        };

        currentFilters = newFilters;
        currentPage = 1;
        await loadAnime(1);
        updateSortButtonsState();
    };

    filterStatus.addEventListener('change', applyFilters);
    filterType.addEventListener('change', applyFilters);
    filterYear.addEventListener('change', applyFilters);
    filterGenre.addEventListener('change', applyFilters);
}

// Обработчики сортировки
function setupSorting() {
    const sortByScore = document.getElementById('sort-by-score');
    const sortByTitle = document.getElementById('sort-by-title');
    const sortByYearBtn = document.getElementById('sort-by-year');

    const applySorting = async () => {
        // При изменении сортировки перезагружаем данные с сервера
        currentPage = 1;
        await loadAnime(1);
        updateSortButtonsState();
    };

    sortByScore.addEventListener('click', () => {
        if (currentSort.field === 'score') {
            currentSort.direction = currentSort.direction === 'desc' ? 'asc' : 'desc';
        } else {
            currentSort.field = 'score';
            currentSort.direction = 'desc';
        }
        applySorting();
    });

    sortByTitle.addEventListener('click', () => {
        if (currentSort.field === 'title') {
            currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            currentSort.field = 'title';
            currentSort.direction = 'asc';
        }
        applySorting();
    });

    sortByYearBtn.addEventListener('click', () => {
        if (currentSort.field === 'year') {
            currentSort.direction = currentSort.direction === 'desc' ? 'asc' : 'desc';
        } else {
            currentSort.field = 'year';
            currentSort.direction = 'desc';
        }
        applySorting();
    });
}

// Обновление состояния кнопок сортировки
function updateSortButtonsState() {
    const sortByScore = document.getElementById('sort-by-score');
    const sortByTitle = document.getElementById('sort-by-title');
    const sortByYearBtn = document.getElementById('sort-by-year');

    const allSortBtns = [sortByScore, sortByTitle, sortByYearBtn];
    allSortBtns.forEach(btn => {
        if (btn) {
            btn.style.background = '';
            btn.style.borderColor = '';
        }
    });

    let activeBtn = null;
    if (currentSort.field === 'score') activeBtn = sortByScore;
    else if (currentSort.field === 'title') activeBtn = sortByTitle;
    else if (currentSort.field === 'year') activeBtn = sortByYearBtn;

    if (activeBtn) {
        activeBtn.style.background = 'var(--primary-color)';
        activeBtn.style.borderColor = 'var(--primary-color)';

        const icon = activeBtn.querySelector('i');
        if (icon) {
            if (currentSort.direction === 'asc') {
                if (currentSort.field === 'title') {
                    icon.className = 'fas fa-sort-alpha-up';
                } else {
                    icon.className = 'fas fa-arrow-up';
                }
            } else {
                if (currentSort.field === 'title') {
                    icon.className = 'fas fa-sort-alpha-down';
                } else {
                    icon.className = 'fas fa-arrow-down';
                }
            }
        }
    }
}

// Настройка пагинации
function setupPagination() {
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');

    prevBtn.addEventListener('click', async () => {
        if (currentPage > 1 && !isLoading) {
            currentPage--;
            await loadAnime(currentPage);
        }
    });

    nextBtn.addEventListener('click', async () => {
        if (currentPage < lastPage && !isLoading) {
            currentPage++;
            await loadAnime(currentPage);
        }
    });
}

// Основная инициализация
document.addEventListener('DOMContentLoaded', () => {
    const welcomeScreen = document.getElementById('welcome-screen');
    const mainScreen = document.getElementById('main-screen');
    const usernameInput = document.getElementById('username-input');
    const enterButton = document.getElementById('enter-button');
    const greeting = document.getElementById('greeting');
    const themeToggles = document.querySelectorAll('.theme-toggle');
    const searchInput = document.getElementById('search-input');
    const resetBtn = document.getElementById('reset-filters');

    // Добавляем элемент для информации о сортировке
    const statsContainer = document.querySelector('.stats-container');
    if (statsContainer && !document.getElementById('sort-info')) {
        const sortInfo = document.createElement('div');
        sortInfo.id = 'sort-info';
        sortInfo.style.cssText = 'font-size: 0.8rem; color: #ffaa00; margin-top: 5px; display: none;';
        statsContainer.appendChild(sortInfo);
    }

    initializeThemeToggle(themeToggles);

    enterButton.addEventListener('click', async () => {
        const name = usernameInput.value.trim();
        if (!name) {
            showInputError(usernameInput);
            return;
        }

        username = name;

        welcomeScreen.style.transition = 'opacity 0.3s';
        welcomeScreen.style.opacity = '0';
        setTimeout(async () => {
            welcomeScreen.classList.add('hidden');
            mainScreen.classList.remove('hidden');
            greeting.textContent = `Привет, ${username}! 👋`;

            mainScreen.style.opacity = '0';
            mainScreen.style.transition = 'opacity 0.3s';
            setTimeout(() => {
                mainScreen.style.opacity = '1';
            }, 50);

            await loadFilters();
            setupFilters();
            setupSorting();
            setupPagination();
            await loadAnime(1);
            updateSortButtonsState();
        }, 300);
    });

    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            enterButton.click();
        }
    });

    searchInput.addEventListener('input', (e) => {
        handleSearch(e.target.value);
    });

    resetBtn.addEventListener('click', async () => {
        await resetFilters();
    });
});