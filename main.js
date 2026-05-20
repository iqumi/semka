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
let useServerSorting = true;

// ─────────────────────────────────────────────
// Тема
// ─────────────────────────────────────────────
function getIsDark() {
    return !document.body.classList.contains('light-theme');
}

function applyTheme(isDark) {
    document.body.classList.toggle('light-theme', !isDark);
    document.querySelectorAll('.theme-toggle i').forEach(icon => {
        icon.className = isDark ? 'fas fa-moon' : 'fas fa-sun';
    });
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function initializeThemeToggle() {
    const savedTheme = localStorage.getItem('theme');
    // По умолчанию тёмная тема
    const isDark = savedTheme !== 'light';
    applyTheme(isDark);

    document.addEventListener('click', (e) => {
        const toggle = e.target.closest('.theme-toggle');
        if (toggle) {
            applyTheme(!getIsDark());
        }
    });
}

// ─────────────────────────────────────────────
// Ошибка ввода имени
// ─────────────────────────────────────────────
function showInputError(input) {
    input.classList.add('error');
    const orig = input.placeholder;
    input.placeholder = 'Пожалуйста, введите ваше имя';
    setTimeout(() => {
        input.classList.remove('error');
        input.placeholder = orig;
    }, 2000);
}

// ─────────────────────────────────────────────
// Загрузка аниме
// ─────────────────────────────────────────────
async function loadAnime(page = 1) {
    if (isLoading) return;
    isLoading = true;

    const gridContainer = document.getElementById('anime-grid');
    gridContainer.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i><p>Загрузка аниме...</p></div>';

    try {
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

            // Клиентская сортировка только при поиске
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

// ─────────────────────────────────────────────
// Пагинация
// ─────────────────────────────────────────────
function updatePagination() {
    const pageInfo = document.getElementById('page-info');
    if (pageInfo) pageInfo.textContent = `Страница ${currentPage} из ${lastPage}`;

    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    if (prevBtn) prevBtn.disabled = currentPage <= 1;
    if (nextBtn) nextBtn.disabled = currentPage >= lastPage;
}

function setupPagination() {
    document.getElementById('prev-page').addEventListener('click', async () => {
        if (currentPage > 1 && !isLoading) {
            currentPage--;
            await loadAnime(currentPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    document.getElementById('next-page').addEventListener('click', async () => {
        if (currentPage < lastPage && !isLoading) {
            currentPage++;
            await loadAnime(currentPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
}

// ─────────────────────────────────────────────
// Фильтры
// ─────────────────────────────────────────────
async function loadFilters() {
    const [years, genres] = await Promise.all([fetchYears(), fetchGenres()]);
    populateYearFilter(document.getElementById('filter-year'), years);
    populateGenreFilter(document.getElementById('filter-genre'), genres);
}

function setupFilters() {
    const applyFilters = async () => {
        currentFilters = {
            status: document.getElementById('filter-status').value,
            type: document.getElementById('filter-type').value,
            year: document.getElementById('filter-year').value,
            genre: document.getElementById('filter-genre').value
        };
        currentPage = 1;
        await loadAnime(1);
        updateSortButtonsState();
    };

    ['filter-status', 'filter-type', 'filter-year', 'filter-genre'].forEach(id => {
        document.getElementById(id).addEventListener('change', applyFilters);
    });
}

// ─────────────────────────────────────────────
// Сброс
// ─────────────────────────────────────────────
async function resetFilters() {
    currentFilters = { status: '', type: '', year: '', genre: '' };
    currentSearchTerm = '';
    currentSort = { field: 'score', direction: 'desc' };

    document.getElementById('search-input').value = '';
    ['filter-status', 'filter-type', 'filter-year', 'filter-genre'].forEach(id => {
        document.getElementById(id).value = '';
    });

    currentPage = 1;
    await loadAnime(currentPage);
    updateSortButtonsState();
}

// ─────────────────────────────────────────────
// Поиск с debounce
// ─────────────────────────────────────────────
let searchTimeout;
function handleSearch(searchTerm) {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(async () => {
        currentSearchTerm = searchTerm.trim();
        currentPage = 1;
        await loadAnime(1);
        updateSortButtonsState();
    }, 500);
}

// ─────────────────────────────────────────────
// Сортировка
// ─────────────────────────────────────────────
function setupSorting() {
    const buttons = {
        'sort-by-score': 'score',
        'sort-by-title': 'title',
        'sort-by-year': 'year'
    };

    Object.entries(buttons).forEach(([id, field]) => {
        document.getElementById(id).addEventListener('click', async () => {
            if (currentSort.field === field) {
                currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort.field = field;
                currentSort.direction = field === 'title' ? 'asc' : 'desc';
            }
            currentPage = 1;
            await loadAnime(1);
            updateSortButtonsState();
        });
    });
}

function updateSortButtonsState() {
    const fieldToId = {
        'score': 'sort-by-score',
        'title': 'sort-by-title',
        'year': 'sort-by-year'
    };

    Object.entries(fieldToId).forEach(([field, id]) => {
        const btn = document.getElementById(id);
        if (!btn) return;
        const isActive = currentSort.field === field;
        btn.style.background = isActive ? 'var(--primary-color)' : '';
        btn.style.borderColor = isActive ? 'var(--primary-color)' : '';
        btn.style.color = isActive ? 'white' : '';

        const icon = btn.querySelector('i');
        if (icon && isActive) {
            if (field === 'title') {
                icon.className = currentSort.direction === 'asc' ? 'fas fa-sort-alpha-down' : 'fas fa-sort-alpha-up';
            } else {
                icon.className = currentSort.direction === 'desc' ? 'fas fa-arrow-down' : 'fas fa-arrow-up';
            }
        } else if (icon) {
            // Сбрасываем иконку
            if (field === 'score') icon.className = 'fas fa-star';
            if (field === 'title') icon.className = 'fas fa-sort-alpha-down';
            if (field === 'year') icon.className = 'fas fa-calendar';
        }
    });
}

// ─────────────────────────────────────────────
// Инициализация
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const welcomeScreen = document.getElementById('welcome-screen');
    const mainScreen = document.getElementById('main-screen');
    const usernameInput = document.getElementById('username-input');
    const enterButton = document.getElementById('enter-button');
    const greeting = document.getElementById('greeting');
    const searchInput = document.getElementById('search-input');
    const resetBtn = document.getElementById('reset-filters');

    initializeThemeToggle();

    const startApp = async () => {
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
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    mainScreen.style.opacity = '1';
                });
            });

            await loadFilters();
            setupFilters();
            setupSorting();
            setupPagination();
            await loadAnime(1);
            updateSortButtonsState();
        }, 300);
    };

    enterButton.addEventListener('click', startApp);
    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') startApp();
    });

    searchInput.addEventListener('input', (e) => handleSearch(e.target.value));
    resetBtn.addEventListener('click', resetFilters);
});
