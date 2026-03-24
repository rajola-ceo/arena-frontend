// js/pages/profileSettings.js
import { userService } from '../services/userService.js';
import { coinService } from '../services/coinService.js';

class ProfileSettingsPage {
    constructor() {
        this.avatarData = null;
        this.currentUser = null;
        this.userData = null;
    }
    
    async init() {
        this.currentUser = window.App.currentUser;
        if (!this.currentUser) {
            window.location.href = 'index.html';
            return;
        }
        
        this.userData = window.App.userData;
        this.loadUserData();
        this.setupEventListeners();
    }
    
    loadUserData() {
        // Set display name
        const displayNameInput = document.getElementById('displayName');
        if (displayNameInput) {
            displayNameInput.value = this.userData?.customDisplayName || this.currentUser.displayName || '';
        }
        
        // Set email
        const emailDisplay = document.getElementById('emailDisplay');
        if (emailDisplay) {
            emailDisplay.innerText = this.currentUser.email || '';
        }
        
        // Set avatar preview
        const previewImg = document.getElementById('previewImg');
        const placeholder = document.getElementById('avatarPlaceholder');
        const avatarUrl = this.userData?.customAvatar || this.currentUser.photoURL;
        
        if (avatarUrl) {
            previewImg.src = avatarUrl;
            previewImg.style.display = 'block';
            if (placeholder) placeholder.style.display = 'none';
        }
    }
    
    setupEventListeners() {
        // Avatar upload
        const avatarUpload = document.getElementById('avatarUpload');
        if (avatarUpload) {
            avatarUpload.addEventListener('change', (e) => this.handleAvatarUpload(e));
        }
        
        // Save button
        const saveBtn = document.getElementById('saveBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveProfile());
        }
        
        // Camera button
        const cameraBtn = document.getElementById('cameraBtn');
        if (cameraBtn) {
            cameraBtn.addEventListener('click', () => this.takePhoto());
        }
        
        // Remove avatar button
        const removeBtn = document.getElementById('removeAvatarBtn');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => this.removeAvatar());
        }
    }
    
    handleAvatarUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            window.App.showToast('Please select an image file', 'error');
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) {
            window.App.showToast('Image must be less than 5MB', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.avatarData = e.target.result;
            const previewImg = document.getElementById('previewImg');
            const placeholder = document.getElementById('avatarPlaceholder');
            if (previewImg) {
                previewImg.src = this.avatarData;
                previewImg.style.display = 'block';
            }
            if (placeholder) placeholder.style.display = 'none';
            window.App.showToast('Photo selected! Click Save to apply.', 'info');
        };
        reader.readAsDataURL(file);
    }
    
    takePhoto() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';
        input.onchange = (e) => this.handleAvatarUpload(e);
        input.click();
    }
    
    removeAvatar() {
        this.avatarData = null;
        const previewImg = document.getElementById('previewImg');
        const placeholder = document.getElementById('avatarPlaceholder');
        if (previewImg) {
            previewImg.style.display = 'none';
            previewImg.src = '';
        }
        if (placeholder) placeholder.style.display = 'flex';
        window.App.showToast('Avatar removed. Click Save to apply.', 'info');
    }
    
    async saveProfile() {
        const displayName = document.getElementById('displayName').value.trim();
        
        if (!displayName) {
            window.App.showToast('Please enter a display name', 'error');
            return;
        }
        
        if (displayName.length < 3) {
            window.App.showToast('Display name must be at least 3 characters', 'error');
            return;
        }
        
        const result = await userService.updateProfile(this.currentUser.uid, {
            customDisplayName: displayName,
            customAvatar: this.avatarData || this.userData?.customAvatar
        });
        
        if (result.success) {
            // Update local user data
            this.userData.customDisplayName = displayName;
            this.userData.customAvatar = this.avatarData || this.userData?.customAvatar;
            window.App.userData = this.userData;
            
            window.App.showToast('Profile updated successfully!', 'success');
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 1500);
        } else {
            window.App.showToast(result.error, 'error');
        }
    }
}

// Initialize page
const profileSettings = new ProfileSettingsPage();
document.addEventListener('DOMContentLoaded', () => profileSettings.init());
