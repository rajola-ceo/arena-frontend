// js/app.js - Main application controller
import { authService } from './services/authService.js';
import { userService } from './services/userService.js';
import { coinService } from './services/coinService.js';
import { leagueService } from './services/leagueService.js';
import { teamService } from './services/teamService.js';

class App {
    constructor() {
        this.currentUser = null;
        this.userData = null;
        this.userCoins = 0;
        this.isInitialized = false;
    }
    
    // Initialize the app
    async init() {
        console.log('🚀 App initializing...');
        
        // Setup auth listener
        authService.onAuthStateChanged(async (user) => {
            if (user) {
                this.currentUser = user;
                this.userData = await userService.getUser(user.uid);
                this.userCoins = await coinService.getUserCoins(user.uid);
                
                // Update UI
                this.updateUI();
                
                console.log('✅ User logged in:', this.userData?.customDisplayName || user.displayName);
                
                // Trigger page-specific initialization
                this.initPage();
            } else {
                // Redirect to login if not authenticated
                const currentPage = window.location.pathname.split('/').pop();
                if (!currentPage.includes('index.html') && !currentPage.includes('login.html')) {
                    window.location.href = 'index.html';
                }
            }
        });
    }
    
    // Page-specific initialization
    initPage() {
        const page = window.location.pathname.split('/').pop();
        
        switch(page) {
            case 'home.html':
                this.initHomePage();
                break;
            case 'tournaments.html':
                this.initTournamentsPage();
                break;
            case 'league-create.html':
                this.initLeagueCreatePage();
                break;
            case 'league-view.html':
                this.initLeagueViewPage();
                break;
            case 'league-dashboard.html':
                this.initLeagueDashboardPage();
                break;
            case 'team-create.html':
                this.initTeamCreatePage();
                break;
            case 'team-view.html':
                this.initTeamViewPage();
                break;
            case 'my-leagues.html':
                this.initMyLeaguesPage();
                break;
            case 'leaderboard.html':
                this.initLeaderboardPage();
                break;
            case 'profile-settings.html':
                this.initProfileSettingsPage();
                break;
        }
    }
    
    // Update UI elements
    updateUI() {
        // Update coin display
        const coinElements = document.querySelectorAll('.venoCoinsAmount');
        coinElements.forEach(el => {
            el.textContent = this.userCoins;
        });
        
        // Update profile picture and name
        const displayName = this.userData?.customDisplayName || this.currentUser?.displayName || 'Player';
        const avatarUrl = this.userData?.customAvatar || this.currentUser?.photoURL;
        
        const profileImgs = document.querySelectorAll('.profile-avatar-img');
        profileImgs.forEach(img => {
            img.src = avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=10b981&color=fff&size=128`;
        });
        
        const nameSpans = document.querySelectorAll('.profile-name-display');
        nameSpans.forEach(span => {
            span.textContent = displayName;
        });
    }
    
    // Home page initialization
    async initHomePage() {
        console.log('🏠 Initializing home page...');
        
        // Load featured leagues
        const leagues = await leagueService.getAllLeagues();
        this.renderFeaturedLeagues(leagues.slice(0, 6));
        
        // Load active leagues
        const activeLeagues = await leagueService.getActiveLeagues();
        this.renderActiveLeagues(activeLeagues.slice(0, 3));
        
        // Load user's teams
        const teams = await teamService.getUserTeams(this.currentUser.uid);
        this.renderMyTeams(teams);
        
        // Load all users
        const users = await userService.getAllUsers();
        this.renderAllUsers(users);
    }
    
    renderFeaturedLeagues(leagues) {
        const container = document.getElementById('featuredLeagues');
        if (!container) return;
        
        if (leagues.length === 0) {
            container.innerHTML = '<div class="empty-state">No leagues yet. Be the first to create one!</div>';
            return;
        }
        
        container.innerHTML = '';
        leagues.forEach(league => {
            const card = this.createLeagueCard(league);
            container.appendChild(card);
        });
    }
    
    renderActiveLeagues(leagues) {
        const container = document.getElementById('activeLeagues');
        if (!container) return;
        
        if (leagues.length === 0) {
            container.innerHTML = '<div class="empty-state">No active leagues at the moment</div>';
            return;
        }
        
        container.innerHTML = '';
        leagues.forEach(league => {
            const card = this.createLeagueCard(league);
            container.appendChild(card);
        });
    }
    
    renderMyTeams(teams) {
        const container = document.getElementById('myTeams');
        if (!container) return;
        
        if (teams.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <p>You haven't created any teams yet</p>
                    <button class="btn-primary" onclick="window.location.href='team-create.html'">Create Your First Team</button>
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        teams.forEach(team => {
            const card = this.createTeamCard(team);
            container.appendChild(card);
        });
    }
    
    renderAllUsers(users) {
        const container = document.getElementById('allUsersList');
        if (!container) return;
        
        const currentUserId = this.currentUser.uid;
        const filteredUsers = users.filter(u => u.uid !== currentUserId);
        
        if (filteredUsers.length === 0) {
            container.innerHTML = '<div class="empty-state">No other players found</div>';
            return;
        }
        
        container.innerHTML = '';
        filteredUsers.forEach(user => {
            const card = this.createUserCard(user);
            container.appendChild(card);
        });
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
        
        const statusText = league.status === 'live' ? 'LIVE' : 
                          league.status === 'registration' ? 'REGISTRATION OPEN' : 
                          league.status === 'upcoming' ? 'UPCOMING' : 'COMPLETED';
        
        card.innerHTML = `
            <div class="league-header">
                <span class="league-status status-${league.status}">${statusText}</span>
                <div class="league-icon"><i class="fas fa-futbol"></i></div>
                <h3>${league.name}</h3>
                <div class="league-game">${league.gameType || 'eFootball'}</div>
                ${isOwner ? '<div class="owner-badge"><i class="fas fa-crown"></i> Your League</div>' : ''}
                ${hasJoined ? '<div class="joined-badge"><i class="fas fa-check-circle"></i> Joined</div>' : ''}
            </div>
            <div class="league-body">
                <div class="league-stats">
                    <div class="stat"><div class="stat-value ${isFull ? 'full' : ''}">${teamCount}/${maxTeams}</div><div class="stat-label">Teams</div></div>
                    <div class="stat"><div class="stat-value">${league.prizePool || 0}</div><div class="stat-label">Prize Pool</div></div>
                    <div class="stat"><div class="stat-value">${league.entryFee || 0}</div><div class="stat-label">Entry Fee</div></div>
                </div>
                <div class="league-owner"><i class="fas fa-user"></i> Created by: <strong>${league.ownerName || 'Unknown'}</strong></div>
            </div>
            <div class="league-footer">
                ${!isOwner && !hasJoined ? `
                    <button class="join-btn" onclick="event.stopPropagation(); window.App.joinLeague('${league.id}')" ${isFull ? 'disabled' : ''}>
                        <i class="fas fa-sign-in-alt"></i> ${isFull ? 'League Full' : 'Join League'}
                    </button>
                ` : hasJoined ? `
                    <button class="joined-btn" disabled><i class="fas fa-check-circle"></i> Joined</button>
                ` : ''}
                <button class="details-btn" onclick="event.stopPropagation(); window.location.href='league-view.html?id=${league.id}'">
                    <i class="fas fa-info-circle"></i> Details
                </button>
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
            <div class="team-info">
                <div class="team-name">${team.name}</div>
                <div class="team-stats">
                    <span><i class="fas fa-trophy"></i> ${team.stats?.wins || 0} Wins</span>
                    <span><i class="fas fa-futbol"></i> ${team.stats?.matchesPlayed || 0} Matches</span>
                </div>
            </div>
            <i class="fas fa-chevron-right"></i>
        `;
        return card;
    }
    
    createUserCard(user) {
        const card = document.createElement('div');
        card.className = 'user-card';
        card.onclick = () => window.location.href = `user-profile.html?id=${user.uid}`;
        
        const displayName = user.customDisplayName || user.displayName || user.username || 'Player';
        const avatarUrl = user.customAvatar || user.photoURL;
        
        card.innerHTML = `
            <div class="user-avatar">
                <img src="${avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=10b981&color=fff`}">
            </div>
            <div class="user-info">
                <div class="user-name">${displayName}</div>
                <div class="user-stats">
                    <span><i class="fas fa-trophy"></i> ${user.leaguesWon || 0}</span>
                    <span><i class="fas fa-futbol"></i> ${user.matchesPlayed || 0}</span>
                </div>
            </div>
            <button class="challenge-btn" onclick="event.stopPropagation(); window.App.challengeUser('${user.uid}')">
                <i class="fas fa-handshake"></i> Challenge
            </button>
        `;
        return card;
    }
    
    // Join league
    async joinLeague(leagueId) {
        if (!this.currentUser) {
            this.showToast('Please login first', 'error');
            window.location.href = 'index.html';
            return;
        }
        
        const league = await leagueService.getLeague(leagueId);
        if (!league) {
            this.showToast('League not found', 'error');
            return;
        }
        
        const userCoins = this.userCoins;
        if (league.entryFee > userCoins) {
            this.showToast(`Need ${league.entryFee} Veno Coins to join! You have ${userCoins}`, 'error');
            return;
        }
        
        const displayName = this.userData?.customDisplayName || this.currentUser.displayName;
        const avatarUrl = this.userData?.customAvatar || this.currentUser.photoURL;
        
        const result = await leagueService.joinLeague(leagueId, this.currentUser.uid, displayName, avatarUrl);
        
        if (result.success) {
            await coinService.deductCoins(this.currentUser.uid, league.entryFee, 'league_join');
            await this.refreshCoins();
            this.showToast(`Successfully joined ${league.name}!`, 'success');
            location.reload();
        } else {
            this.showToast(result.error, 'error');
        }
    }
    
    // Challenge user
    async challengeUser(userId) {
        if (!this.currentUser) {
            this.showToast('Please login first', 'error');
            return;
        }
        
        const targetUser = await userService.getUser(userId);
        if (!targetUser) {
            this.showToast('User not found', 'error');
            return;
        }
        
        const challengerName = this.userData?.customDisplayName || this.currentUser.displayName;
        const targetName = targetUser.customDisplayName || targetUser.displayName;
        
        if (confirm(`Challenge ${targetName} to a match?`)) {
            // Create challenge notification
            await this.createNotification(userId, {
                title: '⚔️ Match Challenge!',
                message: `${challengerName} has challenged you to a match!`,
                icon: '⚔️',
                type: 'challenge',
                data: {
                    challengerId: this.currentUser.uid,
                    challengerName: challengerName,
                    timestamp: Date.now()
                }
            });
            
            this.showToast(`Challenge sent to ${targetName}!`, 'success');
        }
    }
    
    // Create notification
    async createNotification(userId, notification) {
        try {
            const notificationRef = doc(db, 'notifications', `${userId}_${Date.now()}`);
            await setDoc(notificationRef, {
                userId,
                ...notification,
                read: false,
                createdAt: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error creating notification:', error);
        }
    }
    
    // Refresh coins
    async refreshCoins() {
        this.userCoins = await coinService.getUserCoins(this.currentUser.uid);
        this.updateUI();
        return this.userCoins;
    }
    
    // Claim daily reward
    async claimDaily() {
        const result = await coinService.claimDaily(this.currentUser.uid);
        if (result.success) {
            await this.refreshCoins();
            this.showToast(`🎉 You claimed ${result.amount} Veno Coins!`, 'success');
        } else {
            this.showToast(result.error, 'error');
        }
    }
    
    // Show toast notification
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
    
    // Get user display name
    getUserDisplayName(userId) {
        // Will be implemented with user data
        return 'User';
    }
}

// Initialize global App instance
window.App = new App();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.App.init();
});
