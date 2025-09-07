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
        closeCurrentDialog();
        
        const modal = document.getElementById('custom-confirm-modal');
        const titleElement = document.getElementById('confirm-title');
        const messageElement = document.getElementById('confirm-message');
        const cancelButton = document.getElementById('confirm-cancel-btn');
        const confirmButton = document.getElementById('confirm-ok-btn');
        
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
 * Show a dialog
 * @param {HTMLElement} modal - The modal element to show
 */
function showDialog(modal) {
    modal.classList.remove('hidden');
    // Use requestAnimationFrame to ensure the class is added after the element is visible
    requestAnimationFrame(() => {
        modal.classList.add('modal--active');
    });
}

/**
 * Close a dialog
 * @param {HTMLElement} modal - The modal element to close
 */
function closeDialog(modal) {
    modal.classList.remove('modal--active');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300); // Match the CSS transition duration
    
    if (currentDialog === modal) {
        currentDialog = null;
    }
}

/**
 * Close the currently open dialog if any
 */
function closeCurrentDialog() {
    if (currentDialog) {
        closeDialog(currentDialog);
    }
}

// Initialize dialog system
export function initDialogs() {
    // Close dialogs when clicking on the modal background
    const modals = [
        document.getElementById('custom-alert-modal'),
        document.getElementById('custom-confirm-modal')
    ];
    
    modals.forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeDialog(modal);
                }
            });
        }
    });
}
