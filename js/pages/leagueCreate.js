// js/pages/leagueCreate.js
import { leagueService } from '../services/leagueService.js';

class LeagueCreatePage {
    constructor() {
        this.currentUser = null;
    }
    
    async init() {
        this.currentUser = window.App.currentUser;
        if (!this.currentUser) {
            window.location.href = 'index.html';
            return;
        }
        
        this.setupEventListeners();
        this.updatePrizeDistribution();
    }
    
    setupEventListeners() {
        const maxTeams = document.getElementById('maxTeams');
        const entryFee = document.getElementById('entryFee');
        
        if (maxTeams) maxTeams.addEventListener('change', () => this.updatePrizeDistribution());
        if (entryFee) entryFee.addEventListener('change', () => this.updatePrizeDistribution());
        
        // Format options
        document.querySelectorAll('.format-option').forEach(opt => {
            opt.addEventListener('click', () => {
                document.querySelectorAll('.format-option').forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                document.getElementById('leagueFormat').value = opt.dataset.format;
            });
        });
        
        // Form submission
        const form = document.getElementById('createLeagueForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
    }
    
    updatePrizeDistribution() {
        const totalTeams = parseInt(document.getElementById('maxTeams')?.value) || 16;
        const entryFee = parseInt(document.getElementById('entryFee')?.value) || 0;
        const totalPrize = totalTeams * entryFee * 0.8;
        
        const first = Math.floor(totalPrize * 0.5);
        const second = Math.floor(totalPrize * 0.3);
        const third = Math.floor(totalPrize * 0.2);
        
        const firstInput = document.getElementById('firstPrize');
        const secondInput = document.getElementById('secondPrize');
        const thirdInput = document.getElementById('thirdPrize');
        
        if (firstInput) firstInput.value = first;
        if (secondInput) secondInput.value = second;
        if (thirdInput) thirdInput.value = third;
    }
    
    async handleSubmit(e) {
        e.preventDefault();
        
        const leagueName = document.getElementById('leagueName')?.value.trim();
        if (!leagueName) {
            window.App.showToast('League name is required', 'error');
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
            ownerName: this.currentUser.customDisplayName || this.currentUser.displayName,
            gameType: document.getElementById('gameType')?.value || 'eFootball'
        };
        
        const result = await leagueService.createLeague(leagueData);
        
        if (result.success) {
            window.App.showToast('League created successfully!', 'success');
            setTimeout(() => {
                window.location.href = `league-view.html?id=${result.id}`;
            }, 1500);
        } else {
            window.App.showToast(result.error, 'error');
        }
    }
}

// Initialize page
const leagueCreate = new LeagueCreatePage();
document.addEventListener('DOMContentLoaded', () => leagueCreate.init());
