// js/lib/index.js - Complete utility library
// ===================== UTILITIES =====================

// Format time
export function formatTime(date) {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString();
}

// Format date
export function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString();
}

// Format number with commas
export function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Truncate text
export function truncate(text, maxLength = 100) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substr(0, text.lastIndexOf(' ', maxLength)) + '...';
}

// Escape HTML
export function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Debounce function
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function
export function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Copy to clipboard
export function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!', 'success');
    }).catch(() => {
        showToast('Failed to copy', 'error');
    });
}

// Generate random ID
export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Get URL parameters
export function getUrlParams() {
    const params = {};
    const queryString = window.location.search.substring(1);
    const pairs = queryString.split('&');
    for (let pair of pairs) {
        const [key, value] = pair.split('=');
        if (key) params[decodeURIComponent(key)] = decodeURIComponent(value || '');
    }
    return params;
}

// Scroll to element
export function scrollToElement(elementId, offset = 0) {
    const element = document.getElementById(elementId);
    if (element) {
        const yOffset = offset;
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
    }
}

// ===================== VALIDATORS =====================

// Validate email
export function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Validate phone
export function isValidPhone(phone) {
    return /^\d{7,15}$/.test(phone);
}

// Validate username
export function isValidUsername(username) {
    return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

// Validate URL
export function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

// ===================== STORAGE =====================

// Local storage wrapper
export const storage = {
    get(key, defaultValue = null) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : defaultValue;
        } catch {
            return defaultValue;
        }
    },
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch {
            return false;
        }
    },
    remove(key) {
        localStorage.removeItem(key);
    },
    clear() {
        localStorage.clear();
    }
};

// Session storage wrapper
export const sessionStorage = {
    get(key, defaultValue = null) {
        try {
            const value = window.sessionStorage.getItem(key);
            return value ? JSON.parse(value) : defaultValue;
        } catch {
            return defaultValue;
        }
    },
    set(key, value) {
        try {
            window.sessionStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch {
            return false;
        }
    },
    remove(key) {
        window.sessionStorage.removeItem(key);
    }
};

// ===================== IMAGE HANDLING =====================

// Convert file to base64
export function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Validate image file
export function isValidImage(file) {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    return validTypes.includes(file.type) && file.size <= maxSize;
}

// Get image dimensions
export function getImageDimensions(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            resolve({ width: img.width, height: img.height });
            URL.revokeObjectURL(img.src);
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}

// Compress image
export async function compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                let width = img.width;
                let height = img.height;
                
                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }
                
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => {
                    resolve(blob);
                }, file.type, quality);
            };
            img.onerror = reject;
        };
        reader.onerror = reject;
    });
}

// ===================== DOM HELPERS =====================

// Create element with classes and attributes
export function createElement(tag, classes = [], attributes = {}, children = []) {
    const element = document.createElement(tag);
    if (classes.length) element.classList.add(...classes);
    Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
    });
    children.forEach(child => {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else {
            element.appendChild(child);
        }
    });
    return element;
}

// Add event listener with cleanup
export function addEventListenerWithCleanup(element, event, handler) {
    element.addEventListener(event, handler);
    return () => element.removeEventListener(event, handler);
}

// Detect click outside
export function onClickOutside(element, callback) {
    const handler = (e) => {
        if (!element.contains(e.target)) {
            callback();
            document.removeEventListener('click', handler);
        }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
}

// ===================== ANIMATIONS =====================

// Fade in element
export function fadeIn(element, duration = 300) {
    element.style.opacity = '0';
    element.style.display = 'block';
    element.style.transition = `opacity ${duration}ms`;
    setTimeout(() => { element.style.opacity = '1'; }, 10);
}

// Fade out element
export function fadeOut(element, duration = 300) {
    element.style.opacity = '1';
    element.style.transition = `opacity ${duration}ms`;
    element.style.opacity = '0';
    setTimeout(() => { element.style.display = 'none'; }, duration);
}

// Slide down element
export function slideDown(element, duration = 300) {
    element.style.display = 'block';
    const height = element.scrollHeight;
    element.style.height = '0';
    element.style.overflow = 'hidden';
    element.style.transition = `height ${duration}ms`;
    setTimeout(() => { element.style.height = height + 'px'; }, 10);
    setTimeout(() => {
        element.style.height = 'auto';
        element.style.overflow = 'visible';
    }, duration);
}

// Slide up element
export function slideUp(element, duration = 300) {
    element.style.height = element.scrollHeight + 'px';
    element.style.overflow = 'hidden';
    element.style.transition = `height ${duration}ms`;
    setTimeout(() => { element.style.height = '0'; }, 10);
    setTimeout(() => {
        element.style.display = 'none';
        element.style.height = 'auto';
        element.style.overflow = 'visible';
    }, duration);
}

// ===================== CONSTANTS =====================

export const CONSTANTS = {
    // Game types
    GAME_TYPES: {
        eFOOTBALL: 'eFootball',
        FC: 'FC (FIFA/EA Sports FC)',
        DLS: 'Dream League Soccer (DLS)'
    },
    
    // League formats
    LEAGUE_FORMATS: {
        ROUND_ROBIN: 'league',
        GROUP_KNOCKOUT: 'group',
        CUP: 'cup'
    },
    
    // League statuses
    LEAGUE_STATUS: {
        REGISTRATION: 'registration',
        LIVE: 'live',
        COMPLETED: 'completed',
        UPCOMING: 'upcoming'
    },
    
    // Prize distribution percentages
    PRIZE_PERCENTAGES: {
        FIRST: 0.5,
        SECOND: 0.3,
        THIRD: 0.2
    },
    
    // Coin rewards
    COINS: {
        DAILY_REWARD: 10,
        SPIN_COST: 200,
        SPIN_MIN: 50,
        SPIN_MAX: 5000,
        LEAGUE_JOIN_MIN: 10,
        LEAGUE_JOIN_MAX: 500
    },
    
    // Limits
    LIMITS: {
        MAX_TEAM_PLAYERS: 25,
        MIN_TEAM_PLAYERS: 11,
        MAX_LEAGUE_TEAMS: 32,
        MIN_LEAGUE_TEAMS: 4,
        MAX_USERNAME_LENGTH: 20,
        MIN_USERNAME_LENGTH: 3
    }
};

// ===================== EXPORT ALL =====================

export default {
    formatTime,
    formatDate,
    formatNumber,
    truncate,
    escapeHtml,
    debounce,
    throttle,
    copyToClipboard,
    generateId,
    getUrlParams,
    scrollToElement,
    isValidEmail,
    isValidPhone,
    isValidUsername,
    isValidUrl,
    storage,
    sessionStorage,
    fileToBase64,
    isValidImage,
    getImageDimensions,
    compressImage,
    createElement,
    addEventListenerWithCleanup,
    onClickOutside,
    fadeIn,
    fadeOut,
    slideDown,
    slideUp,
    CONSTANTS
};
