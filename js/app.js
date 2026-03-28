// ===================== VENO-ARENA COMPLETE APP =====================
// This single file contains ALL your frontend code
// Connects to Render backend: https://crunck-backend.onrender.com

// ===================== IMPORTS & CONFIG =====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { 
    getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { 
    getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, 
    deleteDoc, addDoc, query, where, orderBy, limit, Timestamp,
    arrayUnion, arrayRemove
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { 
    getStorage, ref, uploadBytes, getDownloadURL, deleteObject 
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
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);
const googleProvider = new GoogleAuthProvider();

// ===================== BACKEND API CONFIG =====================
const API_URL = 'https://arena-backend-cv5d.onrender.com';

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

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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

function showToast(message, type = 'success') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
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

// ===================== USER SERVICE (Backend API) =====================
const userService = {
    async getUser(uid) {
        try {
            return await apiRequest(`/api/users/${uid}`);
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    },
    
    async saveUser(uid, userData) {
        try {
            return await apiRequest(`/api/users/${uid}`, {
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
    }
};

// ===================== COIN SERVICE (Backend API) =====================
const coinService = {
    async getBalance(uid) {
        try {
            const data = await apiRequest(`/api/coins/${uid}`);
            return data.balance;
        } catch (error) {
            console.error('Error getting coins:', error);
            return 100;
        }
    },
    
    async claimDaily(uid) {
        try {
            return await apiRequest(`/api/coins/${uid}/claim`, { method: 'POST' });
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

// ===================== LEAGUE SERVICE (Backend API) =====================
const leagueService = {
    async getAllLeagues(status = null) {
        try {
            const url = status ? `/api/leagues?status=${status}` : '/api/leagues';
            return await apiRequest(url);
        } catch (error) {
            console.error('Error getting leagues:', error);
            return [];
        }
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
    
    async joinLeague(leagueId, teamName) {
        try {
            return await apiRequest(`/api/leagues/${leagueId}/join`, {
                method: 'POST',
                body: JSON.stringify({ teamName })
            });
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

// ===================== TEAM SERVICE (Backend API) =====================
const teamService = {
    async getUserTeams(userId) {
        try {
            return await apiRequest(`/api/teams/${userId}`);
        } catch (error) {
            console.error('Error getting teams:', error);
            return [];
        }
    },
    
    async createTeam(teamData) {
        try {
            return await apiRequest('/api/teams', {
                method: 'POST',
                body: JSON.stringify(teamData)
            });
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

// ===================== AUTH SERVICE =====================
const authService = {
    currentUser: null,
    
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
                    createdAt: new Date().toISOString()
                };
                await userService.saveUser(firebaseUser.uid, userData);
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
    }
};

// ===================== MAIN APP CLASS =====================
class App {
    constructor() {
        this.currentUser = null;
        this.userData = null;
        this.userCoins = 0;
    }
    
    async init() {
        console.log('🚀 App initializing...');
        
        authService.onAuthStateChanged(async (user) => {
            if (user) {
                this.currentUser = user;
                this.userData = await userService.getUser(user.uid);
                this.userCoins = await coinService.getBalance(user.uid);
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
            case 'tournaments.html': this.initHomePage(); break;
        }
    }
    
    updateUI() {
        const coinElements = document.querySelectorAll('.venoCoinsAmount, #venoCoinsAmount');
        coinElements.forEach(el => el.textContent = this.userCoins);
        
        const displayName = this.userData?.customDisplayName || this.currentUser?.displayName || 'Player';
        const avatarUrl = this.userData?.customAvatar || this.currentUser?.photoURL;
        
        const profileImgs = document.querySelectorAll('.profile-avatar-img, #profileAvatarImg, #googleProfilePic, .profile-pic');
        profileImgs.forEach(img => {
            img.src = avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=10b981&color=fff&size=128`;
        });
        
        const nameSpans = document.querySelectorAll('.profile-name-display, #profileNameDisplay, #accountName');
        nameSpans.forEach(span => span.textContent = displayName);
        
        const emailSpans = document.querySelectorAll('#profileEmailDisplay, #accountEmail');
        if (emailSpans.length && this.currentUser?.email) {
            emailSpans.forEach(span => span.textContent = this.currentUser.email);
        }
    }
    
    async refreshCoins() {
        this.userCoins = await coinService.getBalance(this.currentUser.uid);
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
    
    // ===================== HOME PAGE =====================
    async initHomePage() {
        console.log('🏠 Initializing home page...');
        const leagues = await leagueService.getAllLeagues();
        this.renderFeaturedLeagues(leagues.slice(0, 6));
        
        const activeLeagues = await leagueService.getAllLeagues('registration');
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
                ${!isOwner && !hasJoined ? `<button class="join-btn" onclick="event.stopPropagation(); window.App.joinLeague('${league.id}')" ${isFull ? 'disabled' : ''}><i class="fas fa-sign-in-alt"></i> ${isFull ? 'League Full' : 'Join League'} (${league.entryFee} VC)</button>` : hasJoined ? `<button class="joined-btn" disabled><i class="fas fa-check-circle"></i> Joined</button>` : ''}
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
        const result = await leagueService.joinLeague(leagueId, `${displayName}'s Team`);
        
        if (result.success) {
            await this.refreshCoins();
            showToast(`Successfully joined ${league.name}!`, 'success');
            location.reload();
        } else {
            showToast(result.error, 'error');
        }
    }
    
    // ===================== LEAGUE CREATE PAGE =====================
    initLeagueCreatePage() {
        console.log('🏆 Initializing league create page...');
        this.setupLeagueCreateForm();
        this.setupPrizeDistribution();
    }
    
    setupPrizeDistribution() {
        const maxTeams = document.getElementById('maxTeams');
        const entryFee = document.getElementById('entryFee');
        
        const updatePrizes = () => {
            const teams = parseInt(maxTeams?.value) || 16;
            const fee = parseInt(entryFee?.value) || 0;
            const totalPrize = teams * fee * 0.8;
            
            const first = document.getElementById('firstPrize');
            const second = document.getElementById('secondPrize');
            const third = document.getElementById('thirdPrize');
            
            if (first) first.value = Math.floor(totalPrize * 0.5);
            if (second) second.value = Math.floor(totalPrize * 0.3);
            if (third) third.value = Math.floor(totalPrize * 0.2);
        };
        
        if (maxTeams) maxTeams.addEventListener('change', updatePrizes);
        if (entryFee) entryFee.addEventListener('change', updatePrizes);
        updatePrizes();
        
        // Format selector
        document.querySelectorAll('.format-option').forEach(opt => {
            opt.addEventListener('click', function() {
                document.querySelectorAll('.format-option').forEach(o => o.classList.remove('active'));
                this.classList.add('active');
                const formatInput = document.getElementById('leagueFormat');
                if (formatInput) formatInput.value = this.dataset.format;
            });
        });
    }
    
    setupLeagueCreateForm() {
        const form = document.getElementById('createLeagueForm');
        if (!form) return;
        
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
            if (result.success && result.id) {
                showToast('League created successfully!', 'success');
                setTimeout(() => window.location.href = `league-view.html?id=${result.id}`, 1500);
            } else {
                showToast(result.error || 'Failed to create league', 'error');
            }
        });
    }
    
    // ===================== LEAGUE VIEW PAGE =====================
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
            if (teams.length === 0) {
                teamsContainer.innerHTML = '<div class="empty-state">No teams joined yet. Be the first!</div>';
            } else {
                teamsContainer.innerHTML = '';
                teams.forEach(team => {
                    const card = document.createElement('div');
                    card.className = 'team-card-view';
                    card.onclick = () => window.location.href = `team-view.html?id=${team.id}`;
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
    
    // ===================== TEAM CREATE PAGE =====================
    initTeamCreatePage() {
        console.log('⚽ Initializing team create page...');
        const form = document.getElementById('createTeamForm');
        if (!form) return;
        
        // Logo upload
        const uploadBtn = document.getElementById('uploadLogoBtn');
        const logoInput = document.getElementById('teamLogo');
        const logoPreview = document.getElementById('logoPreview');
        
        if (uploadBtn && logoInput) {
            uploadBtn.addEventListener('click', () => logoInput.click());
            logoInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file && logoPreview) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        logoPreview.innerHTML = `<img src="${ev.target.result}" style="width:100%;height:100%;object-fit:cover;">`;
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
        
        // Formation selector
        document.querySelectorAll('.formation-option').forEach(opt => {
            opt.addEventListener('click', function() {
                document.querySelectorAll('.formation-option').forEach(o => o.classList.remove('active'));
                this.classList.add('active');
                const formationInput = document.getElementById('formation');
                if (formationInput) formationInput.value = this.dataset.formation;
            });
        });
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const teamName = document.getElementById('teamName')?.value.trim();
            if (!teamName) {
                showToast('Team name is required', 'error');
                return;
            }
            
            const teamData = {
                name: teamName,
                shortName: document.getElementById('teamShortName')?.value || teamName.slice(0, 5),
                stadium: document.getElementById('homeStadium')?.value || '',
                gameType: document.getElementById('gameType')?.value || 'eFootball',
                formation: document.getElementById('formation')?.value || '4-4-2',
                logo: null,
                players: [],
                ownerId: this.currentUser.uid,
                ownerName: this.userData?.customDisplayName || this.currentUser.displayName
            };
            
            const result = await teamService.createTeam(teamData);
            if (result.success && result.id) {
                showToast('Team created successfully!', 'success');
                setTimeout(() => window.location.href = `team-view.html?id=${result.id}`, 1500);
            } else {
                showToast(result.error || 'Failed to create team', 'error');
            }
        });
    }
    
    // ===================== MY LEAGUES PAGE =====================
    async initMyLeaguesPage() {
        console.log('📋 Initializing my leagues page...');
        const leagues = await leagueService.getAllLeagues();
        const myLeagues = leagues.filter(l => 
            l.ownerId === this.currentUser?.uid || 
            l.teams?.some(t => t.ownerId === this.currentUser?.uid)
        );
        
        const container = document.getElementById('myLeaguesList');
        if (container) {
            if (myLeagues.length === 0) {
                container.innerHTML = '<div class="empty-state">You haven\'t joined or created any leagues yet.</div>';
            } else {
                container.innerHTML = '';
                myLeagues.forEach(league => container.appendChild(this.createLeagueCard(league)));
            }
        }
    }
    
    // ===================== PROFILE SETTINGS PAGE =====================
    initProfileSettingsPage() {
        console.log('👤 Initializing profile settings page...');
        
        const displayNameInput = document.getElementById('displayName');
        if (displayNameInput) {
            displayNameInput.value = this.userData?.customDisplayName || this.currentUser?.displayName || '';
        }
        
        const emailDisplay = document.getElementById('emailDisplay');
        if (emailDisplay && this.currentUser?.email) {
            emailDisplay.innerText = this.currentUser.email;
        }
        
        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', async () => {
                const displayName = document.getElementById('displayName').value.trim();
                if (!displayName) {
                    showToast('Please enter a display name', 'error');
                    return;
                }
                const result = await userService.updateUser(this.currentUser.uid, {
                    customDisplayName: displayName
                });
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

// ===================== SIDEBAR & NAVIGATION =====================
function initSidebar() {
    const menuBtn = document.getElementById('menuBtn');
    const sidebar = document.getElementById('sidebar');
    const closeSidebar = document.getElementById('closeSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (menuBtn && sidebar) {
        menuBtn.addEventListener('click', () => {
            sidebar.classList.add('open');
            if (overlay) overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
        
        const closeFunc = () => {
            sidebar.classList.remove('open');
            if (overlay) overlay.classList.remove('active');
            document.body.style.overflow = '';
        };
        
        if (closeSidebar) closeSidebar.addEventListener('click', closeFunc);
        if (overlay) overlay.addEventListener('click', closeFunc);
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && sidebar.classList.contains('open')) closeFunc();
        });
    }
    
    // Navigation
    const navItems = {
        menuHome: 'home.html',
        menuTournaments: 'home.html',
        menuLeagues: 'my-leagues.html',
        menuTeams: 'teams.html',
        menuCreateLeague: 'league-create.html',
        menuCreateTeam: 'team-create.html',
        menuLeaderboard: 'leaderboard.html',
        menuProfile: 'profile-settings.html'
    };
    
    for (const [id, url] of Object.entries(navItems)) {
        const element = document.getElementById(id);
        if (element) element.addEventListener('click', () => window.location.href = url);
    }
    
    // Venaura link
    const venauraIcon = document.getElementById('venauraIcon');
    if (venauraIcon) {
        venauraIcon.addEventListener('click', () => window.open('https://venauraai.netlify.app/', '_blank'));
    }
    
    // Profile dropdown
    const profileDropdown = document.getElementById('profileDropdown');
    const profilePopup = document.getElementById('profilePopup');
    if (profileDropdown && profilePopup) {
        profileDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
            profilePopup.classList.toggle('active');
        });
        document.addEventListener('click', () => profilePopup?.classList.remove('active'));
    }
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await authService.logout();
            localStorage.removeItem('crunkUser');
            window.location.href = 'index.html';
        });
    }
    
    // Theme toggle
    const menuTheme = document.getElementById('menuTheme');
    const themeLabel = document.getElementById('themeLabel');
    if (menuTheme) {
        menuTheme.addEventListener('click', () => {
            document.body.classList.toggle('light-theme');
            const isLight = document.body.classList.contains('light-theme');
            if (themeLabel) themeLabel.innerText = isLight ? 'Light' : 'Dark';
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
        });
    }
    
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        if (themeLabel) themeLabel.innerText = 'Light';
    }
}

// ===================== DAILY CLAIM BUTTON =====================
function initClaimButton() {
    const claimBtn = document.getElementById('claimVenoCoinsBtn');
    if (!claimBtn) return;
    
    const LAST_CLAIM_KEY = 'lastVenoClaim';
    let app = window.App;
    
    function canClaim() {
        const last = localStorage.getItem(LAST_CLAIM_KEY);
        if (!last) return true;
        return (Date.now() - parseInt(last)) >= 24 * 60 * 60 * 1000;
    }
    
    function updateClaimButton() {
        if (canClaim()) {
            claimBtn.disabled = false;
            claimBtn.innerHTML = '<i class="fas fa-gift"></i> Claim 10';
            claimBtn.style.opacity = '1';
        } else {
            claimBtn.disabled = true;
            const lastClaim = parseInt(localStorage.getItem(LAST_CLAIM_KEY));
            const timeLeft = 24 * 60 * 60 * 1000 - (Date.now() - lastClaim);
            const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
            const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
            claimBtn.innerHTML = `<i class="fas fa-clock"></i> ${hoursLeft}h ${minutesLeft}m left`;
            claimBtn.style.opacity = '0.6';
        }
    }
    
    claimBtn.addEventListener('click', async () => {
        if (canClaim() && app) {
            await app.claimDaily();
            localStorage.setItem(LAST_CLAIM_KEY, Date.now().toString());
            updateClaimButton();
        } else {
            showToast('Already claimed! Come back tomorrow', 'error');
        }
    });
    
    updateClaimButton();
    setInterval(updateClaimButton, 60000);
}

// ===================== INITIALIZE =====================
document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    initClaimButton();
    window.App = new App();
    window.App.init();
});

// Make functions global
window.showToast = showToast;
window.joinLeague = (leagueId) => window.App?.joinLeague(leagueId);
window.viewLeague = (leagueId) => window.location.href = `league-view.html?id=${leagueId}`;

console.log('✅ Veno-Arena loaded - Connected to Render backend at', 'https://arena-backend-cv5d.onrender.com');
