// js/services/authService.js
import { 
    auth, 
    googleProvider, 
    signInWithPopup, 
    signOut, 
    onAuthStateChanged 
} from '../config/firebase.js';
import { userService } from './userService.js';

class AuthService {
    constructor() {
        this.currentUser = null;
        this.listeners = [];
    }
    
    // Login with Google
    async loginWithGoogle() {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const firebaseUser = result.user;
            
            // Check if user exists in Firestore
            let userData = await userService.getUser(firebaseUser.uid);
            
            if (!userData) {
                // Create new user
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
            } else {
                // Update last login
                await userService.updateUser(firebaseUser.uid, {
                    lastLogin: new Date().toISOString()
                });
            }
            
            return { success: true, user: { ...firebaseUser, ...userData } };
        } catch (error) {
            console.error('Google login error:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Logout
    async logout() {
        try {
            await signOut(auth);
            this.currentUser = null;
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }
    
    // Subscribe to auth changes
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
    
    // Check if user is logged in
    isAuthenticated() {
        return this.currentUser !== null;
    }
    
    // Require auth (redirect if not logged in)
    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }
}

export const authService = new AuthService();
