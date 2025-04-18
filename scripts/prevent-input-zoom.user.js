// ==UserScript==
// @name         Universal Input Zoom Prevention
// @namespace    disable-input-zoom
// @version      2.1
// @icon         https://raw.githubusercontent.com/shinobu-xx/userscripts/refs/heads/main/images/E972B9C0-EC0F-42C1-A2D6-DF9E9602866A.png
// @description  Prevents Safari from zooming on input fields across all websites without breaking navigation
// @author       shinobu-xx
// @updateURL    https://raw.githubusercontent.com/shinobu-xx/userscripts/refs/heads/main/scripts/prevent-input-zoom.user.js
// @downloadURL  https://raw.githubusercontent.com/shinobu-xx/userscripts/refs/heads/main/scripts/prevent-input-zoom.user.js
// @match        *://*/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // Store original viewport content
    let originalViewportContent = null;
    let lastFocusedElement = null;

    // Function to save the original viewport
    const saveOriginalViewport = () => {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport && !originalViewportContent) {
            originalViewportContent = viewport.content;
        }
    };

    // Function to update the viewport for input focus
    const updateViewportForInput = () => {
        // Save original viewport settings first if needed
        saveOriginalViewport();
    
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            // Only modify if zoom prevention not already present
            if (!viewport.content.includes('maximum-scale=1')) {
                viewport.content = viewport.content + ', maximum-scale=1';
            }
        } else {
            // Create new viewport if none exists
            const newViewport = document.createElement('meta');
            newViewport.name = 'viewport';
            newViewport.content = 'width=device-width, initial-scale=1, maximum-scale=1';
            document.head.appendChild(newViewport);
        }
    };

    // Function to restore original viewport
    const restoreOriginalViewport = () => {
        if (originalViewportContent) {
            const viewport = document.querySelector('meta[name="viewport"]');
            if (viewport) {
                viewport.content = originalViewportContent;
            }
        }
    };

    // Function to handle input focus
    const handleInputFocus = (element) => {
        if (!element) return;
      
        lastFocusedElement = element;
        updateViewportForInput();
    };

    // Function to handle input blur
    const handleInputBlur = () => {
        lastFocusedElement = null;
        // Small delay to avoid interfering with navigation
        setTimeout(restoreOriginalViewport, 300);
    };

    // Set up main event listeners
    const setupEventListeners = () => {
        // Focus events - bubbling phase for minimal interference
        document.addEventListener('focusin', (e) => {
            if (e.target.tagName === 'INPUT' ||
                e.target.tagName === 'TEXTAREA' ||
                e.target.tagName === 'SELECT') {
                handleInputFocus(e.target);
            }
        }, false);

        // Blur events - bubbling phase
        document.addEventListener('focusout', (e) => {
            if (e.target.tagName === 'INPUT' ||
                e.target.tagName === 'TEXTAREA' ||
                e.target.tagName === 'SELECT') {
                handleInputBlur();
            }
        }, false);

        // Touch events - capturing phase for problematic inputs
        document.addEventListener('touchstart', (e) => {
            if (e.target.tagName === 'INPUT' ||
                e.target.tagName === 'TEXTAREA' ||
                e.target.tagName === 'SELECT') {
                handleInputFocus(e.target);
            }
        }, true);
    };

    // Add CSS to help with zoom prevention
    const addCSSFixes = () => {
        const style = document.createElement('style');
        style.textContent = `
            /* Universal input zoom prevention */
            input, textarea, select {
                font-size: 16px !important; /* iOS doesn't zoom on 16px or larger */
                touch-action: manipulation !important;
            }
          
            /* Common search input types */
            input[type="search"],
            input[type="text"],
            input[type="email"],
            input[type="tel"],
            input[type="url"],
            input[type="password"] {
                font-size: 16px !important;
                touch-action: manipulation !important;
            }
        `;
        document.head.appendChild(style);
    };

    // Initialize everything
    const init = () => {
        saveOriginalViewport();
        setupEventListeners();
        addCSSFixes();
    };

    // Initialize based on document ready state
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Also run on load
    window.addEventListener('load', init);

    console.log('Universal Input Zoom Prevention loaded');
})();
