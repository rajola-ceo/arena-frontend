// js/app.js - Main application logic
import { authService } from './services/auth.js';
import { userService } from './services/userService.js';
import { leagueService } from './services/leagueService.js';
import { coinService } from './services/coinService.js';
import { loadHeader, loadSidebar } from './components/header.js';

// Global state
window.App = {
    currentUser: null,
    userData: null,
    userCoins: 0,
    
    async init() {
        console.log('🚀 App initializing...');
        
        // Load header and sidebar components
        await loadHeader();
        await loadSidebar();
        
        // Setup auth listener
        authService.onAuthStateChanged(async (user) => {
            if (user) {
                this.currentUser = user;
                this.userData = await userService.getUser(user.uid);
                this.userCoins = await coinService.getUserCoins(user.uid);
                
                // Update UI with user data
                this.updateUI();
                
                console.log('✅ User logged in:', this.userData?.customDisplayName || user.displayName);
            } else {
                // Redirect to login if not authenticated
                if (!window.location.pathname.includes('index.html')) {
                    window.location.href = 'index.html';
                }
            }
        });
    },
    
    updateUI() {
        // Update coin display
        const coinElements = document.querySelectorAll('.venoCoinsAmount');
        coinElements.forEach(el => {
            el.textContent = this.userCoins;
        });
        
        // Update profile picture
        const avatarUrl = this.userData?.customAvatar || this.currentUser?.photoURL;
        const displayName = this.userData?.customDisplayName || this.currentUser?.displayName;
        
        const profileImgs = document.querySelectorAll('.profile-avatar-img');
        profileImgs.forEach(img => {
            img.src = avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=10b981&color=fff&size=128`;
        });
        
        const nameSpans = document.querySelectorAll('.profile-name-display');
        nameSpans.forEach(span => {
            span.textContent = displayName;
        });
    },
    
    async refreshCoins() {
        this.userCoins = await coinService.getUserCoins(this.currentUser.uid);
        this.updateUI();
        return this.userCoins;
    },
    
    async claimDaily() {
        const result = await coinService.claimDaily(this.currentUser.uid);
        if (result.success) {
            await this.refreshCoins();
            this.showToast(`🎉 You claimed ${result.amount} Veno Coins!`, 'success');
        } else {
            this.showToast(result.error, 'error');
        }
    },
    
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i> ${message}`;
        container.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.App.init();
});

// Make App global
window.App = App;
