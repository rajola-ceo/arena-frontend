// js/pages/leagueView.js
import { leagueService } from '../services/leagueService.js';

class LeagueViewPage {
    constructor() {
        this.leagueId = null;
        this.league = null;
        this.currentUser = null;
    }
    
    async init() {
        const urlParams = new URLSearchParams(window.location.search);
        this.leagueId = urlParams.get('id');
        this.currentUser = window.App.currentUser;
        
        if (!this.leagueId) {
            window.App.showToast('League not found', 'error');
            setTimeout(() => window.location.href = 'home.html', 1500);
            return;
        }
        
        await this.loadLeague();
        this.setupEventListeners();
    }
    
    async loadLeague() {
        this.league = await leagueService.getLeague(this.leagueId);
        
        if (!this.league) {
            window.App.showToast('League not found', 'error');
            setTimeout(() => window.location.href = 'home.html', 1500);
            return;
        }
        
        this.renderLeagueHeader();
        this.renderTeams();
        this.renderStandings();
        this.renderFixtures();
        
        // Check if user already joined
        const hasJoined = this.league.teams?.some(t => t.ownerId === this.currentUser?.uid);
        const joinBtn = document.getElementById('joinLeagueBtn');
        if (joinBtn && hasJoined) {
            joinBtn.style.display = 'none';
        }
    }
    
    renderLeagueHeader() {
        document.getElementById('leagueName').innerText = this.league.name;
        
        const creatorName = this.getUserDisplayName(this.league.ownerId);
        
        const metaHtml = `
            <div class="meta-item"><i class="fas fa-gamepad"></i> ${this.league.gameType}</div>
            <div class="meta-item"><i class="fas fa-users"></i> ${this.league.teams?.length || 0}/${this.league.maxTeams} Teams</div>
            <div class="meta-item"><i class="fas fa-trophy"></i> Prize: ${this.league.prizePool || 0} VC</div>
            <div class="meta-item"><i class="fas fa-coins"></i> Entry: ${this.league.entryFee || 0} VC</div>
            <div class="meta-item"><i class="fas fa-chart-line"></i> Format: ${this.league.format === 'league' ? 'Round Robin' : this.league.format === 'group' ? 'Group + Knockout' : 'Cup'}</div>
            <div class="meta-item"><i class="fas fa-user"></i> Created by: <strong>${creatorName}</strong></div>
        `;
        document.getElementById('leagueMeta').innerHTML = metaHtml;
    }
    
    renderTeams() {
        const container = document.getElementById('teamsGrid');
        const teams = this.league.teams || [];
        
        if (teams.length === 0) {
            container.innerHTML = '<div class="empty-state">No teams joined yet. Be the first!</div>';
            return;
        }
        
        container.innerHTML = '';
        teams.forEach(team => {
            const ownerName = this.getUserDisplayName(team.ownerId);
            const card = document.createElement('div');
            card.className = 'team-card-view';
            card.onclick = () => window.location.href = `team-view.html?id=${team.id}`;
            card.innerHTML = `
                <div class="team-logo-view">${team.logo ? `<img src="${team.logo}">` : '<i class="fas fa-shield-alt"></i>'}</div>
                <div class="team-name-view">${team.name}</div>
                <div class="team-stats-view">Owner: ${ownerName}</div>
            `;
            container.appendChild(card);
        });
    }
    
    renderStandings() {
        const tbody = document.getElementById('standingsBody');
        if (!tbody) return;
        
        const standings = [];
        const teams = this.league.teams || [];
        
        teams.forEach(team => {
            standings.push({
                teamId: team.id,
                teamName: team.name,
                teamLogo: team.logo,
                ownerId: team.ownerId,
                played: 0, wins: 0, draws: 0, losses: 0,
                goalsFor: 0, goalsAgainst: 0, points: 0
            });
        });
        
        (this.league.matches || []).forEach(match => {
            if (match.result) {
                const homeTeam = standings.find(s => s.teamId === match.homeTeamId);
                const awayTeam = standings.find(s => s.teamId === match.awayTeamId);
                if (homeTeam && awayTeam) {
                    homeTeam.played++; awayTeam.played++;
                    homeTeam.goalsFor += match.homeScore;
                    homeTeam.goalsAgainst += match.awayScore;
                    awayTeam.goalsFor += match.awayScore;
                    awayTeam.goalsAgainst += match.homeScore;
                    
                    if (match.homeScore > match.awayScore) {
                        homeTeam.wins++; homeTeam.points += 3;
                        awayTeam.losses++;
                    } else if (match.homeScore < match.awayScore) {
                        awayTeam.wins++; awayTeam.points += 3;
                        homeTeam.losses++;
                    } else {
                        homeTeam.draws++; awayTeam.draws++;
                        homeTeam.points += 1; awayTeam.points += 1;
                    }
                }
            }
        });
        
        standings.sort((a, b) => {
            if (a.points !== b.points) return b.points - a.points;
            const gdA = a.goalsFor - a.goalsAgainst;
            const gdB = b.goalsFor - b.goalsAgainst;
            return gdB - gdA;
        });
        
        tbody.innerHTML = '';
        standings.forEach((team, index) => {
            const ownerName = this.getUserDisplayName(team.ownerId);
            tbody.innerHTML += `
                <tr>
                    <td><strong>${index + 1}</strong></td>
                    <td class="team-cell">
                        <div class="team-logo-small">${team.teamLogo ? `<img src="${team.teamLogo}">` : '<i class="fas fa-shield-alt"></i>'}</div>
                        <div>
                            <strong>${team.teamName}</strong>
                            <div class="owner-name">${ownerName}</div>
                        </div>
                    </td>
                    <td>${team.played}</td>
                    <td>${team.wins}</td>
                    <td>${team.draws}</td>
                    <td>${team.losses}</td>
                    <td>${team.goalsFor}</td>
                    <td>${team.goalsAgainst}</td>
                    <td>${team.goalsFor - team.goalsAgainst}</td>
                    <td><strong>${team.points}</strong></td>
                </tr>
            `;
        });
    }
    
    renderFixtures() {
        const container = document.getElementById('fixturesList');
        const matches = this.league.matches || [];
        
        if (matches.length === 0) {
            container.innerHTML = '<div class="empty-state">Fixtures will be generated when the tournament starts.</div>';
            return;
        }
        
        container.innerHTML = '';
        matches.forEach(match => {
            const homeTeam = this.league.teams?.find(t => t.id === match.homeTeamId);
            const awayTeam = this.league.teams?.find(t => t.id === match.awayTeamId);
            container.innerHTML += `
                <div class="match-card">
                    <div class="match-info">
                        <div class="match-teams">
                            <div class="team"><strong>${homeTeam?.name || 'TBD'}</strong></div>
                            <div class="vs">VS</div>
                            <div class="team"><strong>${awayTeam?.name || 'TBD'}</strong></div>
                        </div>
                        <div class="match-result">${match.result ? `${match.homeScore} - ${match.awayScore}` : 'Not Played'}</div>
                        ${match.screenshot ? `<button class="screenshot-btn" onclick="window.App.showImageModal('${match.screenshot}')"><i class="fas fa-image"></i> View Screenshot</button>` : ''}
                    </div>
                </div>
            `;
        });
    }
    
    setupEventListeners() {
        const joinBtn = document.getElementById('joinLeagueBtn');
        if (joinBtn) {
            joinBtn.addEventListener('click', () => this.joinLeague());
        }
    }
    
    async joinLeague() {
        if (!this.currentUser) {
            window.App.showToast('Please login first', 'error');
            window.location.href = 'index.html';
            return;
        }
        
        const userCoins = window.App.userCoins;
        if (this.league.entryFee > userCoins) {
            window.App.showToast(`Need ${this.league.entryFee} Veno Coins to join! You have ${userCoins}`, 'error');
            return;
        }
        
        const displayName = window.App.userData?.customDisplayName || this.currentUser.displayName;
        const avatarUrl = window.App.userData?.customAvatar || this.currentUser.photoURL;
        
        const result = await leagueService.joinLeague(this.leagueId, this.currentUser.uid, displayName, avatarUrl);
        
        if (result.success) {
            await window.App.refreshCoins();
            window.App.showToast(`Successfully joined ${this.league.name}!`, 'success');
            location.reload();
        } else {
            window.App.showToast(result.error, 'error');
        }
    }
    
    getUserDisplayName(userId) {
        // This will be replaced with actual user data from Firestore
        return 'Player';
    }
}

// Initialize page
const leagueView = new LeagueViewPage();
document.addEventListener('DOMContentLoaded', () => leagueView.init());
