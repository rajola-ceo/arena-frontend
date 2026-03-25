// ===================== COMPLETE APP.JS =====================
// This file contains ALL your JavaScript code in one place
// Includes: Firebase config, services, components, pages, and utilities

// ===================== FIREBASE CONFIGURATION =====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { 
    getAuth, 
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    setDoc, 
    updateDoc, 
    deleteDoc, 
    addDoc, 
    query, 
    where, 
    orderBy, 
    limit, 
    Timestamp,
    arrayUnion,
    arrayRemove
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { 
    getStorage, 
    ref, 
    uploadBytes, 
    getDownloadURL, 
    deleteObject 
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-storage.js";

// Firebase Config
const firebaseConfig = {
    apiKey: "AIzaSyBW0Sz7TODfa8tQJTfNUaLhfK9qJhdA1yE",
    authDomain: "crunck-app.firebaseapp.com",
    projectId: "crunck-app",
    storageBucket: "crunck-app.firebasestorage.app",
    messagingSenderId: "475953302982",
    appId: "1:475953302982:web:607e08379adb12f985f6c7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// ===================== BACKEND API CONFIG =====================
const API_URL = 'https://crunck-backend.onrender.com';

async function getAuthToken() {
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
}

async function apiRequest(endpoint, options = {}) {
    try {
        const token = await getAuthToken();
        if (!token) throw new Error('Not authenticated');
        
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        
        if (!response.ok) {
            let errorMessage = `HTTP ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch (e) {}
            throw new Error(errorMessage);
        }
        
        return await response.json();
    } catch (error) {
        console.error(`API Error [${endpoint}]:`, error);
        throw error;
    }
}

// ===================== UTILITIES =====================
function formatTime(date) {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString();
}

function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString();
}

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => { clearTimeout(timeout); func(...args); };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function getUrlParams() {
    const params = {};
    const queryString = window.location.search.substring(1);
    const pairs = queryString.split('&');
    for (let pair of pairs) {
        const [key, value] = pair.split('=');
        if (key) params[decodeURIComponent(key)] = decodeURIComponent(value || '');
    }
    return params;
}

function createElement(tag, classes = [], attributes = {}, children = []) {
    const element = document.createElement(tag);
    if (classes.length) element.classList.add(...classes);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    children.forEach(child => {
        if (typeof child === 'string') element.appendChild(document.createTextNode(child));
        else element.appendChild(child);
    });
    return element;
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) {
        const newContainer = createElement('div', ['toast-container'], { id: 'toastContainer' });
        document.body.appendChild(newContainer);
    }
    const toastContainer = document.getElementById('toastContainer');
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
    const toast = createElement('div', ['toast', type], {}, [
        createElement('i', [], { class: `fas ${icons[type] || icons.info}` }),
        message
    ]);
    toastContainer.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ===================== USER SERVICE =====================
const userService = {
    async getUser(uid) {
        try {
            return await apiRequest(`/api/users/${uid}`);
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    },
    
    async createUser(userData) {
        try {
            return await apiRequest(`/api/users/${userData.uid}`, {
                method: 'POST',
                body: JSON.stringify(userData)
            });
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    async updateUser(uid, data) {
        try {
            return await apiRequest(`/api/users/${uid}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    async updateProfile(uid, profileData) {
        return this.updateUser(uid, profileData);
    },
    
    async getAllUsers() {
        return [];
    }
};

// ===================== COIN SERVICE =====================
const coinService = {
    async getUserCoins(uid) {
        try {
            const data = await apiRequest(`/api/coins/${uid}`);
            return data.balance;
        } catch (error) {
            return 100;
        }
    },
    
    async claimDaily(uid) {
        try {
            return await apiRequest(`/api/coins/${uid}/claim`, { method: 'POST' });
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    async addCoins(uid, amount, reason) {
        return { success: false, error: 'Use backend endpoints' };
    },
    
    async deductCoins(uid, amount, reason) {
        return { success: false, error: 'Use backend endpoints' };
    }
};

// ===================== LEAGUE SERVICE =====================
const leagueService = {
    async getAllLeagues(status = null) {
        try {
            const url = status ? `/api/leagues?status=${status}` : '/api/leagues';
            return await apiRequest(url);
        } catch (error) {
            return [];
        }
    },
    
    async getActiveLeagues() {
        return this.getAllLeagues('registration');
    },
    
    async getLeague(leagueId) {
        try {
            return await apiRequest(`/api/leagues/${leagueId}`);
        } catch (error) {
            return null;
        }
    },
    
    async createLeague(leagueData) {
        try {
            return await apiRequest('/api/leagues', {
                method: 'POST',
                body: JSON.stringify(leagueData)
            });
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    async joinLeague(leagueId, userId, userName, userAvatar) {
        try {
            return await apiRequest(`/api/leagues/${leagueId}/join`, {
                method: 'POST',
                body: JSON.stringify({ teamName: `${userName}'s Team` })
            });
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    async updateLeague(leagueId, data) {
        try {
            return await apiRequest(`/api/leagues/${leagueId}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

// ===================== TEAM SERVICE =====================
const teamService = {
    async createTeam(teamData) {
        try {
            return await apiRequest('/api/teams', {
                method: 'POST',
                body: JSON.stringify(teamData)
            });
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    async getUserTeams(userId) {
        try {
            return await apiRequest(`/api/teams/${userId}`);
        } catch (error) {
            return [];
        }
    },
    
    async getTeam(teamId) {
        return null;
    },
    
    async updateTeam(teamId, data) {
        return { success: false, error: 'Not implemented' };
    }
};

// ===================== AUTH SERVICE =====================
const authService = {
    currentUser: null,
    listeners: [],
    
    async loginWithGoogle() {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const firebaseUser = result.user;
            let userData = await userService.getUser(firebaseUser.uid);
            if (!userData) {
                userData = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    displayName: firebaseUser.displayName,
                    photoURL: firebaseUser.photoURL,
                    customDisplayName: null,
                    customAvatar: null,
                    hasSetProfile: false,
                    createdAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString()
                };
                await userService.createUser(userData);
            }
            return { success: true, user: { ...firebaseUser, ...userData } };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    async logout() {
        try {
            await signOut(auth);
            this.currentUser = null;
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },
    
    getCurrentUser() {
        return this.currentUser;
    },
    
    onAuthStateChanged(callback) {
        return onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const userData = await userService.getUser(firebaseUser.uid);
                this.currentUser = { ...firebaseUser, ...userData };
                callback(this.currentUser);
            } else {
                this.currentUser = null;
                callback(null);
            }
        });
    },
    
    isAuthenticated() {
        return this.currentUser !== null;
    }
};

// ===================== MAIN APP CLASS =====================
class App {
    constructor() {
        this.currentUser = null;
        this.userData = null;
        this.userCoins = 0;
        this.isInitialized = false;
    }
    
    async init() {
        console.log('🚀 App initializing...');
        
        authService.onAuthStateChanged(async (user) => {
            if (user) {
                this.currentUser = user;
                this.userData = await userService.getUser(user.uid);
                this.userCoins = await coinService.getUserCoins(user.uid);
                this.updateUI();
                console.log('✅ User logged in:', this.userData?.customDisplayName || user.displayName);
                this.initPage();
            } else {
                const currentPage = window.location.pathname.split('/').pop();
                if (!currentPage.includes('index.html') && !currentPage.includes('login.html')) {
                    window.location.href = 'index.html';
                }
            }
        });
    }
    
    initPage() {
        const page = window.location.pathname.split('/').pop();
        switch(page) {
            case 'home.html': this.initHomePage(); break;
            case 'league-create.html': this.initLeagueCreatePage(); break;
            case 'league-view.html': this.initLeagueViewPage(); break;
            case 'team-create.html': this.initTeamCreatePage(); break;
            case 'my-leagues.html': this.initMyLeaguesPage(); break;
            case 'profile-settings.html': this.initProfileSettingsPage(); break;
        }
    }
    
    updateUI() {
        const coinElements = document.querySelectorAll('.venoCoinsAmount');
        coinElements.forEach(el => el.textContent = this.userCoins);
        
        const displayName = this.userData?.customDisplayName || this.currentUser?.displayName || 'Player';
        const avatarUrl = this.userData?.customAvatar || this.currentUser?.photoURL;
        
        const profileImgs = document.querySelectorAll('.profile-avatar-img');
        profileImgs.forEach(img => {
            img.src = avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=10b981&color=fff&size=128`;
        });
        
        const nameSpans = document.querySelectorAll('.profile-name-display');
        nameSpans.forEach(span => span.textContent = displayName);
    }
    
    async initHomePage() {
        console.log('🏠 Initializing home page...');
        const leagues = await leagueService.getAllLeagues();
        this.renderFeaturedLeagues(leagues.slice(0, 6));
        
        const activeLeagues = await leagueService.getActiveLeagues();
        this.renderActiveLeagues(activeLeagues.slice(0, 3));
        
        const teams = await teamService.getUserTeams(this.currentUser.uid);
        this.renderMyTeams(teams);
    }
    
    renderFeaturedLeagues(leagues) {
        const container = document.getElementById('featuredLeagues');
        if (!container) return;
        if (leagues.length === 0) {
            container.innerHTML = '<div class="empty-state">No leagues yet. Be the first to create one!</div>';
            return;
        }
        container.innerHTML = '';
        leagues.forEach(league => container.appendChild(this.createLeagueCard(league)));
    }
    
    renderActiveLeagues(leagues) {
        const container = document.getElementById('activeLeagues');
        if (!container) return;
        if (leagues.length === 0) {
            container.innerHTML = '<div class="empty-state">No active leagues at the moment</div>';
            return;
        }
        container.innerHTML = '';
        leagues.forEach(league => container.appendChild(this.createLeagueCard(league)));
    }
    
    renderMyTeams(teams) {
        const container = document.getElementById('myTeams');
        if (!container) return;
        if (teams.length === 0) {
            container.innerHTML = `<div class="empty-state"><i class="fas fa-users"></i><p>You haven't created any teams yet</p><button class="btn-primary" onclick="window.location.href='team-create.html'">Create Your First Team</button></div>`;
            return;
        }
        container.innerHTML = '';
        teams.forEach(team => container.appendChild(this.createTeamCard(team)));
    }
    
    createLeagueCard(league) {
        const card = document.createElement('div');
        card.className = 'league-card';
        card.onclick = () => window.location.href = `league-view.html?id=${league.id}`;
        
        const teamCount = league.teams?.length || 0;
        const maxTeams = league.maxTeams || 16;
        const isFull = teamCount >= maxTeams;
        const isOwner = this.currentUser && league.ownerId === this.currentUser.uid;
        const hasJoined = league.teams?.some(t => t.ownerId === this.currentUser?.uid);
        
        const statusText = league.status === 'live' ? 'LIVE' : league.status === 'registration' ? 'REGISTRATION OPEN' : league.status === 'upcoming' ? 'UPCOMING' : 'COMPLETED';
        
        card.innerHTML = `
            <div class="league-header">
                <span class="league-status status-${league.status}">${statusText}</span>
                <div class="league-icon"><i class="fas fa-futbol"></i></div>
                <h3>${escapeHtml(league.name)}</h3>
                <div class="league-game">${league.gameType || 'eFootball'}</div>
                ${isOwner ? '<div class="owner-badge"><i class="fas fa-crown"></i> Your League</div>' : ''}
                ${hasJoined ? '<div class="joined-badge"><i class="fas fa-check-circle"></i> Joined</div>' : ''}
            </div>
            <div class="league-body">
                <div class="league-stats">
                    <div class="stat"><div class="stat-value ${isFull ? 'full' : ''}">${teamCount}/${maxTeams}</div><div class="stat-label">Teams</div></div>
                    <div class="stat"><div class="stat-value">${formatNumber(league.prizePool || 0)}</div><div class="stat-label">Prize Pool</div></div>
                    <div class="stat"><div class="stat-value">${formatNumber(league.entryFee || 0)}</div><div class="stat-label">Entry Fee</div></div>
                </div>
                <div class="league-owner"><i class="fas fa-user"></i> Created by: <strong>${escapeHtml(league.ownerName || 'Unknown')}</strong></div>
            </div>
            <div class="league-footer">
                ${!isOwner && !hasJoined ? `<button class="join-btn" onclick="event.stopPropagation(); window.App.joinLeague('${league.id}')" ${isFull ? 'disabled' : ''}><i class="fas fa-sign-in-alt"></i> ${isFull ? 'League Full' : 'Join League'}</button>` : hasJoined ? `<button class="joined-btn" disabled><i class="fas fa-check-circle"></i> Joined</button>` : ''}
                <button class="details-btn" onclick="event.stopPropagation(); window.location.href='league-view.html?id=${league.id}'"><i class="fas fa-info-circle"></i> Details</button>
            </div>
        `;
        return card;
    }
    
    createTeamCard(team) {
        const card = document.createElement('div');
        card.className = 'team-card';
        card.onclick = () => window.location.href = `team-view.html?id=${team.id}`;
        card.innerHTML = `
            <div class="team-logo">${team.logo ? `<img src="${team.logo}" style="width:100%;height:100%;object-fit:cover;">` : '<i class="fas fa-shield-alt"></i>'}</div>
            <div class="team-info"><div class="team-name">${escapeHtml(team.name)}</div><div class="team-stats"><span><i class="fas fa-trophy"></i> ${team.stats?.wins || 0} Wins</span><span><i class="fas fa-futbol"></i> ${team.stats?.matchesPlayed || 0} Matches</span></div></div>
            <i class="fas fa-chevron-right"></i>
        `;
        return card;
    }
    
    async joinLeague(leagueId) {
        if (!this.currentUser) {
            showToast('Please login first', 'error');
            window.location.href = 'index.html';
            return;
        }
        
        const league = await leagueService.getLeague(leagueId);
        if (!league) {
            showToast('League not found', 'error');
            return;
        }
        
        if (league.entryFee > this.userCoins) {
            showToast(`Need ${league.entryFee} Veno Coins to join! You have ${this.userCoins}`, 'error');
            return;
        }
        
        const displayName = this.userData?.customDisplayName || this.currentUser.displayName;
        const result = await leagueService.joinLeague(leagueId, this.currentUser.uid, displayName, null);
        
        if (result.success) {
            this.userCoins = await coinService.getUserCoins(this.currentUser.uid);
            this.updateUI();
            showToast(`Successfully joined ${league.name}!`, 'success');
            location.reload();
        } else {
            showToast(result.error, 'error');
        }
    }
    
    async refreshCoins() {
        this.userCoins = await coinService.getUserCoins(this.currentUser.uid);
        this.updateUI();
        return this.userCoins;
    }
    
    async claimDaily() {
        const result = await coinService.claimDaily(this.currentUser.uid);
        if (result.success) {
            await this.refreshCoins();
            showToast(`🎉 You claimed ${result.amount} Veno Coins!`, 'success');
        } else {
            showToast(result.error, 'error');
        }
    }
    
    async initLeagueCreatePage() {
        console.log('🏆 Initializing league create page...');
        const form = document.getElementById('createLeagueForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const leagueName = document.getElementById('leagueName')?.value.trim();
                if (!leagueName) {
                    showToast('League name is required', 'error');
                    return;
                }
                const maxTeams = parseInt(document.getElementById('maxTeams')?.value) || 16;
                const entryFee = parseInt(document.getElementById('entryFee')?.value) || 0;
                const totalPrize = maxTeams * entryFee * 0.8;
                const leagueData = {
                    name: leagueName,
                    gameType: document.getElementById('gameType')?.value || 'eFootball',
                    format: document.getElementById('leagueFormat')?.value || 'league',
                    maxTeams: maxTeams,
                    entryFee: entryFee,
                    prizePool: totalPrize,
                    prizes: {
                        first: parseInt(document.getElementById('firstPrize')?.value) || 0,
                        second: parseInt(document.getElementById('secondPrize')?.value) || 0,
                        third: parseInt(document.getElementById('thirdPrize')?.value) || 0
                    },
                    description: document.getElementById('description')?.value || '',
                    ownerId: this.currentUser.uid,
                    ownerName: this.userData?.customDisplayName || this.currentUser.displayName
                };
                const result = await leagueService.createLeague(leagueData);
                if (result.success) {
                    showToast('League created successfully!', 'success');
                    setTimeout(() => window.location.href = `league-view.html?id=${result.id}`, 1500);
                } else {
                    showToast(result.error, 'error');
                }
            });
        }
    }
    
    async initLeagueViewPage() {
        const urlParams = getUrlParams();
        const leagueId = urlParams.id;
        if (!leagueId) {
            showToast('League not found', 'error');
            setTimeout(() => window.location.href = 'home.html', 1500);
            return;
        }
        
        const league = await leagueService.getLeague(leagueId);
        if (!league) {
            showToast('League not found', 'error');
            setTimeout(() => window.location.href = 'home.html', 1500);
            return;
        }
        
        document.getElementById('leagueName').innerText = league.name;
        document.getElementById('leagueMeta').innerHTML = `
            <div class="meta-item"><i class="fas fa-gamepad"></i> ${league.gameType}</div>
            <div class="meta-item"><i class="fas fa-users"></i> ${league.teams?.length || 0}/${league.maxTeams} Teams</div>
            <div class="meta-item"><i class="fas fa-trophy"></i> Prize: ${league.prizePool || 0} VC</div>
            <div class="meta-item"><i class="fas fa-coins"></i> Entry: ${league.entryFee || 0} VC</div>
            <div class="meta-item"><i class="fas fa-user"></i> Created by: <strong>${escapeHtml(league.ownerName || 'Unknown')}</strong></div>
        `;
        
        const teamsContainer = document.getElementById('teamsGrid');
        if (teamsContainer) {
            const teams = league.teams || [];
            if (teams.length === 0) teamsContainer.innerHTML = '<div class="empty-state">No teams joined yet. Be the first!</div>';
            else {
                teamsContainer.innerHTML = '';
                teams.forEach(team => {
                    const card = createElement('div', ['team-card-view'], { onclick: () => window.location.href = `team-view.html?id=${team.id}` });
                    card.innerHTML = `<div class="team-logo-view">${team.logo ? `<img src="${team.logo}">` : '<i class="fas fa-shield-alt"></i>'}</div><div class="team-name-view">${escapeHtml(team.name)}</div>`;
                    teamsContainer.appendChild(card);
                });
            }
        }
        
        const joinBtn = document.getElementById('joinLeagueBtn');
        if (joinBtn) {
            const hasJoined = league.teams?.some(t => t.ownerId === this.currentUser?.uid);
            if (hasJoined) joinBtn.style.display = 'none';
            else joinBtn.addEventListener('click', () => this.joinLeague(leagueId));
        }
    }
    
    async initTeamCreatePage() {
        console.log('⚽ Initializing team create page...');
        const form = document.getElementById('createTeamForm');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const teamName = document.getElementById('teamName')?.value.trim();
                if (!teamName) {
                    showToast('Team name is required', 'error');
                    return;
                }
                const result = await teamService.createTeam({
                    name: teamName,
                    ownerId: this.currentUser.uid,
                    ownerName: this.userData?.customDisplayName || this.currentUser.displayName,
                    logo: null,
                    players: []
                });
                if (result.success) {
                    showToast('Team created successfully!', 'success');
                    setTimeout(() => window.location.href = 'home.html', 1500);
                } else {
                    showToast(result.error, 'error');
                }
            });
        }
    }
    
    async initMyLeaguesPage() {
        console.log('📋 Initializing my leagues page...');
        const leagues = await leagueService.getAllLeagues();
        const myLeagues = leagues.filter(l => l.ownerId === this.currentUser?.uid || l.teams?.some(t => t.ownerId === this.currentUser?.uid));
        const container = document.getElementById('myLeaguesList');
        if (container) {
            if (myLeagues.length === 0) container.innerHTML = '<div class="empty-state">You haven\'t joined or created any leagues yet.</div>';
            else {
                container.innerHTML = '';
                myLeagues.forEach(league => container.appendChild(this.createLeagueCard(league)));
            }
        }
    }
    
    async initProfileSettingsPage() {
        console.log('👤 Initializing profile settings page...');
        const displayNameInput = document.getElementById('displayName');
        if (displayNameInput) displayNameInput.value = this.userData?.customDisplayName || this.currentUser?.displayName || '';
        
        const emailDisplay = document.getElementById('emailDisplay');
        if (emailDisplay) emailDisplay.innerText = this.currentUser?.email || '';
        
        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', async () => {
                const displayName = document.getElementById('displayName').value.trim();
                if (!displayName) {
                    showToast('Please enter a display name', 'error');
                    return;
                }
                const result = await userService.updateProfile(this.currentUser.uid, { customDisplayName: displayName });
                if (result.success) {
                    this.userData.customDisplayName = displayName;
                    showToast('Profile updated successfully!', 'success');
                    setTimeout(() => window.location.href = 'home.html', 1500);
                } else {
                    showToast(result.error, 'error');
                }
            });
        }
    }
}

// ===================== INITIALIZE APP =====================
window.App = new App();

document.addEventListener('DOMContentLoaded', () => {
    window.App.init();
});

// Export for use in console
export { auth, db, storage, authService, userService, coinService, leagueService, teamService, showToast as toast };
