// Конфигурация Jikan API
export const API_BASE_URL = 'https://api.jikan.moe/v4';

// Соответствие статусов для отображения на русском
export const STATUS_MAPPINGS = {
    'airing': 'Выходит',
    'completed': 'Завершено',
    'upcoming': 'Анонсировано'
};

// Соответствие типов
export const TYPE_MAPPINGS = {
    'tv': 'TV',
    'movie': 'Фильм',
    'ova': 'OVA',
    'ona': 'ONA',
    'special': 'Спешл'
};

// Цвета для разных типов
export const TYPE_COLORS = {
    'tv': '#4ecdc4',
    'movie': '#ff6b6b',
    'ova': '#45b7d1',
    'ona': '#96ceb4',
    'special': '#feca57'
};