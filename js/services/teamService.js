// js/services/teamService.js
import { db, collection, addDoc, getDocs, getDoc, updateDoc, deleteDoc, doc, query, where } from '../config/firebase.js';

class TeamService {
    // Create team
    async createTeam(teamData) {
        try {
            const teamsRef = collection(db, 'teams');
            const newTeam = {
                ...teamData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                stats: {
                    wins: 0,
                    draws: 0,
                    losses: 0,
                    matchesPlayed: 0,
                    goalsFor: 0,
                    goalsAgainst: 0
                }
            };
            const docRef = await addDoc(teamsRef, newTeam);
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Error creating team:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Get team by ID
    async getTeam(teamId) {
        try {
            const teamRef = doc(db, 'teams', teamId);
            const teamSnap = await getDoc(teamRef);
            return teamSnap.exists() ? { id: teamSnap.id, ...teamSnap.data() } : null;
        } catch (error) {
            console.error('Error getting team:', error);
            return null;
        }
    }
    
    // Get user's teams
    async getUserTeams(userId) {
        try {
            const teamsRef = collection(db, 'teams');
            const q = query(teamsRef, where('ownerId', '==', userId));
            const querySnapshot = await getDocs(q);
            const teams = [];
            querySnapshot.forEach(doc => {
                teams.push({ id: doc.id, ...doc.data() });
            });
            return teams;
        } catch (error) {
            console.error('Error getting user teams:', error);
            return [];
        }
    }
    
    // Update team
    async updateTeam(teamId, data) {
        try {
            const teamRef = doc(db, 'teams', teamId);
            await updateDoc(teamRef, {
                ...data,
                updatedAt: new Date().toISOString()
            });
            return { success: true };
        } catch (error) {
            console.error('Error updating team:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Delete team
    async deleteTeam(teamId) {
        try {
            const teamRef = doc(db, 'teams', teamId);
            await deleteDoc(teamRef);
            return { success: true };
        } catch (error) {
            console.error('Error deleting team:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Add player to team
    async addPlayer(teamId, player) {
        try {
            const team = await this.getTeam(teamId);
            if (!team) return { success: false, error: 'Team not found' };
            
            const updatedPlayers = [...(team.players || []), player];
            await this.updateTeam(teamId, { players: updatedPlayers });
            
            return { success: true };
        } catch (error) {
            console.error('Error adding player:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Remove player from team
    async removePlayer(teamId, playerId) {
        try {
            const team = await this.getTeam(teamId);
            if (!team) return { success: false, error: 'Team not found' };
            
            const updatedPlayers = (team.players || []).filter(p => p.id !== playerId);
            await this.updateTeam(teamId, { players: updatedPlayers });
            
            return { success: true };
        } catch (error) {
            console.error('Error removing player:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Update team stats
    async updateTeamStats(teamId, matchResult) {
        try {
            const team = await this.getTeam(teamId);
            if (!team) return;
            
            const stats = team.stats || {
                wins: 0, draws: 0, losses: 0,
                matchesPlayed: 0, goalsFor: 0, goalsAgainst: 0
            };
            
            stats.matchesPlayed++;
            stats.goalsFor += matchResult.goalsFor;
            stats.goalsAgainst += matchResult.goalsAgainst;
            
            if (matchResult.won) stats.wins++;
            else if (matchResult.drew) stats.draws++;
            else stats.losses++;
            
            await this.updateTeam(teamId, { stats });
        } catch (error) {
            console.error('Error updating team stats:', error);
        }
    }
}

export const teamService = new TeamService();
