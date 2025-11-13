// Custom Dialog System
// This module provides custom alert and confirm dialogs to replace browser defaults

let currentDialog = null;

/**
 * Show a custom alert dialog
 * @param {string} message - The message to display
 * @param {string} title - The title of the dialog (optional)
 * @returns {Promise<void>} - Resolves when the dialog is closed
 */
export function showAlert(message, title = 'Alert') {
    return new Promise((resolve) => {
        closeCurrentDialog();
        
        const modal = document.getElementById('custom-alert-modal');
        const titleElement = document.getElementById('alert-title');
        const messageElement = document.getElementById('alert-message');
        const okButton = document.getElementById('alert-ok-btn');
        
        titleElement.textContent = title;
        messageElement.textContent = message;
        
        // Remove any existing event listeners
        const newOkButton = okButton.cloneNode(true);
        okButton.parentNode.replaceChild(newOkButton, okButton);
        
        // Add new event listener
        newOkButton.addEventListener('click', () => {
            closeDialog(modal);
            resolve();
        });
        
        // Close on ESC key
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                closeDialog(modal);
                document.removeEventListener('keydown', handleKeyDown);
                resolve();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        
        showDialog(modal);
        currentDialog = modal;
    });
}

/**
 * Show a custom confirm dialog
 * @param {string} message - The message to display
 * @param {string} title - The title of the dialog (optional)
 * @returns {Promise<boolean>} - Resolves with true if confirmed, false if cancelled
 */
export function showConfirm(message, title = 'Confirm') {
    return new Promise((resolve) => {
        closeCurrentDialog();
        
        const modal = document.getElementById('custom-confirm-modal');
        const titleElement = document.getElementById('confirm-title');
        const messageElement = document.getElementById('confirm-message');
        const cancelButton = document.getElementById('confirm-cancel-btn');
        const confirmButton = document.getElementById('confirm-ok-btn');
        
        titleElement.textContent = title;
        messageElement.textContent = message;
        
        // Remove any existing event listeners
        const newCancelButton = cancelButton.cloneNode(true);
        const newConfirmButton = confirmButton.cloneNode(true);
        cancelButton.parentNode.replaceChild(newCancelButton, cancelButton);
        confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);
        
        // Add new event listeners
        newCancelButton.addEventListener('click', () => {
            closeDialog(modal);
            resolve(false);
        });
        
        newConfirmButton.addEventListener('click', () => {
            closeDialog(modal);
            resolve(true);
        });
        
        // Close on ESC key (cancel)
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                closeDialog(modal);
                document.removeEventListener('keydown', handleKeyDown);
                resolve(false);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        
        showDialog(modal);
        currentDialog = modal;
        
        // Focus on confirm button for better UX
        setTimeout(() => newConfirmButton.focus(), 100);
    });
}

/**
 * Show a custom confirm dialog with custom button text and colors
 * @param {string} message - The message to display
 * @param {Object} options - Configuration options
 * @param {string} options.title - The title of the dialog
 * @param {string} options.confirmText - Text for the confirm button
 * @param {string} options.cancelText - Text for the cancel button
 * @param {string} options.confirmClass - CSS class for the confirm button (primary-button, danger-button)
 * @returns {Promise<boolean>} - Resolves with true if confirmed, false if cancelled
 */
export function showConfirmDialog(message, options = {}) {
    const {
        title = 'Confirm',
        confirmText = 'Confirm',
        cancelText = 'Cancel',
        confirmClass = 'primary-button'
    } = options;
    
    return new Promise((resolve) => {
        console.log('showConfirmDialog called with:', message);
        closeCurrentDialog();
        
        const modal = document.getElementById('custom-confirm-modal');
        const titleElement = document.getElementById('confirm-title');
        const messageElement = document.getElementById('confirm-message');
        const cancelButton = document.getElementById('confirm-cancel-btn');
        const confirmButton = document.getElementById('confirm-ok-btn');
        
        if (!modal || !titleElement || !messageElement || !cancelButton || !confirmButton) {
            console.error('Dialog elements not found!');
            resolve(false);
            return;
        }
        
        titleElement.textContent = title;
        messageElement.textContent = message;
        
        // Remove any existing event listeners and classes
        const newCancelButton = cancelButton.cloneNode(true);
        const newConfirmButton = confirmButton.cloneNode(true);
        cancelButton.parentNode.replaceChild(newCancelButton, cancelButton);
        confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);
        
        // Set button text
        newCancelButton.textContent = cancelText;
        newConfirmButton.textContent = confirmText;
        
        // Set button classes
        newConfirmButton.className = confirmClass;
        
        let resolved = false;
        
        // Add new event listeners
        newCancelButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!resolved) {
                resolved = true;
                console.log('Cancel button clicked');
                closeDialog(modal);
                resolve(false);
            }
        });
        
        newConfirmButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!resolved) {
                resolved = true;
                console.log('Confirm button clicked');
                closeDialog(modal);
                resolve(true);
            }
        });
        
        // Close on ESC key (cancel)
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && !resolved) {
                resolved = true;
                console.log('ESC key pressed');
                closeDialog(modal);
                document.removeEventListener('keydown', handleKeyDown);
                resolve(false);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        
        showDialog(modal);
        currentDialog = modal;
        console.log('Dialog shown, waiting for user interaction...');
        
        // Focus on confirm button for better UX
        setTimeout(() => {
            if (newConfirmButton && !resolved) {
                newConfirmButton.focus();
            }
        }, 100);
    });
}

function showDialog(modal) {
    modal.classList.remove('hidden');
    
    requestAnimationFrame(() => {
        modal.classList.add('modal--active');
    });
}


function closeDialog(modal) {
    console.log('Closing dialog:', modal.id, 'Stack trace:', new Error().stack);
    modal.classList.remove('modal--active');
    setTimeout(() => {
        modal.classList.add('hidden');
        console.log('Dialog hidden:', modal.id);
    }, 300); 
    
    if (currentDialog === modal) {
        currentDialog = null;
    }
}


function closeCurrentDialog() {
    if (currentDialog) {
        closeDialog(currentDialog);
    }
}

// Initialize dialog system
export function initDialogs() {
    console.log('Initializing dialog system...');
    
    // Close dialogs when clicking on the modal background
    const modals = [
        document.getElementById('custom-alert-modal'),
        document.getElementById('custom-confirm-modal')
    ];
    
    modals.forEach(modal => {
        if (modal) {
            // Remove any existing listeners first
            modal.removeEventListener('click', handleModalBackdropClick);
            
            // Add backdrop click listener
            modal.addEventListener('click', handleModalBackdropClick);
            
            // Prevent clicks on modal content from bubbling up
            const modalContent = modal.querySelector('.modal-content');
            if (modalContent) {
                modalContent.addEventListener('click', (e) => {
                    e.stopPropagation();
                });
            }
        }
    });
    
    console.log('Dialog system initialized');
}



function handleModalBackdropClick(e) {
    // Only close if clicking directly on the modal backdrop, not on child elements
    if (e.target === e.currentTarget) {
        console.log('Modal backdrop clicked, closing dialog');
        closeDialog(e.target);
    }
}
