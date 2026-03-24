// js/services/coinService.js
import { db, doc, getDoc, setDoc, updateDoc, Timestamp } from '../config/firebase.js';

class CoinService {
    // Get user coins
    async getUserCoins(uid) {
        try {
            const coinRef = doc(db, 'userCoins', uid);
            const coinSnap = await getDoc(coinRef);
            
            if (coinSnap.exists()) {
                return coinSnap.data().balance;
            } else {
                // Initialize with 100 coins
                await setDoc(coinRef, {
                    userId: uid,
                    balance: 100,
                    totalEarned: 100,
                    totalSpent: 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
                return 100;
            }
        } catch (error) {
            console.error('Error getting user coins:', error);
            return 0;
        }
    }
    
    // Add coins
    async addCoins(uid, amount, reason = 'unknown') {
        try {
            const coinRef = doc(db, 'userCoins', uid);
            const coinSnap = await getDoc(coinRef);
            const currentBalance = coinSnap.exists() ? coinSnap.data().balance : 100;
            const totalEarned = coinSnap.exists() ? coinSnap.data().totalEarned : 100;
            
            await setDoc(coinRef, {
                userId: uid,
                balance: currentBalance + amount,
                totalEarned: totalEarned + amount,
                totalSpent: coinSnap.exists() ? coinSnap.data().totalSpent : 0,
                updatedAt: new Date().toISOString(),
                createdAt: coinSnap.exists() ? coinSnap.data().createdAt : new Date().toISOString()
            });
            
            // Add transaction record
            await this.addTransaction(uid, amount, 'earn', reason);
            
            return { success: true, newBalance: currentBalance + amount };
        } catch (error) {
            console.error('Error adding coins:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Deduct coins
    async deductCoins(uid, amount, reason = 'unknown') {
        try {
            const coinRef = doc(db, 'userCoins', uid);
            const coinSnap = await getDoc(coinRef);
            const currentBalance = coinSnap.exists() ? coinSnap.data().balance : 100;
            
            if (currentBalance >= amount) {
                await setDoc(coinRef, {
                    userId: uid,
                    balance: currentBalance - amount,
                    totalEarned: coinSnap.exists() ? coinSnap.data().totalEarned : 100,
                    totalSpent: (coinSnap.exists() ? coinSnap.data().totalSpent : 0) + amount,
                    updatedAt: new Date().toISOString(),
                    createdAt: coinSnap.exists() ? coinSnap.data().createdAt : new Date().toISOString()
                });
                
                // Add transaction record
                await this.addTransaction(uid, amount, 'spend', reason);
                
                return { success: true, newBalance: currentBalance - amount };
            } else {
                return { success: false, error: 'Insufficient coins' };
            }
        } catch (error) {
            console.error('Error deducting coins:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Add transaction record
    async addTransaction(uid, amount, type, reason) {
        try {
            const transactionRef = doc(db, 'transactions', `${uid}_${Date.now()}`);
            await setDoc(transactionRef, {
                userId: uid,
                amount: amount,
                type: type,
                reason: reason,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error adding transaction:', error);
        }
    }
    
    // Check daily claim
    async canClaimDaily(uid) {
        try {
            const claimRef = doc(db, 'dailyClaims', uid);
            const claimSnap = await getDoc(claimRef);
            
            if (!claimSnap.exists()) return true;
            
            const lastClaim = new Date(claimSnap.data().lastClaim);
            const now = new Date();
            const hoursSinceClaim = (now - lastClaim) / (1000 * 60 * 60);
            
            return hoursSinceClaim >= 24;
        } catch (error) {
            console.error('Error checking daily claim:', error);
            return true;
        }
    }
    
    // Claim daily reward
    async claimDaily(uid) {
        try {
            const canClaim = await this.canClaimDaily(uid);
            if (!canClaim) {
                return { success: false, error: 'Already claimed today' };
            }
            
            await this.addCoins(uid, 10, 'daily_reward');
            
            const claimRef = doc(db, 'dailyClaims', uid);
            await setDoc(claimRef, {
                userId: uid,
                lastClaim: new Date().toISOString(),
                amount: 10
            });
            
            return { success: true, amount: 10 };
        } catch (error) {
            console.error('Error claiming daily:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Get remaining time for next claim
    async getRemainingClaimTime(uid) {
        try {
            const claimRef = doc(db, 'dailyClaims', uid);
            const claimSnap = await getDoc(claimRef);
            
            if (!claimSnap.exists()) return null;
            
            const lastClaim = new Date(claimSnap.data().lastClaim);
            const nextClaim = new Date(lastClaim.getTime() + (24 * 60 * 60 * 1000));
            const now = new Date();
            
            if (now >= nextClaim) return null;
            
            const diff = nextClaim - now;
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            
            return { hours, minutes, total: diff };
        } catch (error) {
            console.error('Error getting claim time:', error);
            return null;
        }
    }
}

export const coinService = new CoinService();
