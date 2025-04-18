// ==UserScript==
// @name         PWA Enabler for iOS (with Status Bar Fix)
// @namespace    https://github.com/shibobu-xx
// @version      0.2
// @description  Enable PWA installation for any website on iOS Safari with proper status bar handling
// @author       shinobu-xx
// @downloadURL  
// @updateURL    
// @match        *://*/*
// @grant        GM_addStyle
// @grant        unsafeWindow
// @run-at       document-start
// @noframes
// ==/UserScript==

(function() {
    'use strict';

    // Main function to enable PWA capabilities
    function enablePWA() {
        // First, add the meta tags that don't require DOM content
        addWebAppMetaTags();
      
        // Add status bar padding CSS immediately
        addStatusBarSafeAreaCSS();
    
        // Functions that might need DOM content, defer if necessary
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                completePWASetup();
            });
        } else {
            completePWASetup();
        }
    }
  
    // Add CSS to handle status bar safe area
    function addStatusBarSafeAreaCSS() {
        // This CSS will ensure content respects the status bar area
        GM_addStyle(`
            /* Push content below the status bar */
            body {
                padding-top: env(safe-area-inset-top, 44px) !important;
                box-sizing: border-box !important;
            }
          
            /* Fix fixed headers to respect safe area */
            header,
            .header,
            nav,
            .nav,
            .navbar,
            .app-bar,
            div[role="banner"],
            div[class*="header"],
            div[class*="Header"],
            div[id*="header"],
            div[id*="Header"],
            [style*="position: fixed"],
            [style*="position:fixed"],
            [style*="position: sticky"],
            [style*="position:sticky"] {
                padding-top: max(env(safe-area-inset-top, 44px), 10px) !important;
                min-height: calc(44px + env(safe-area-inset-top, 44px)) !important;
            }
          
            /* Specific fixes for hamburger menus and top navigation controls */
            .menu-toggle,
            .hamburger,
            .menu-button,
            button[aria-label*="menu"],
            button[aria-label*="Menu"],
            button[aria-label*="navigation"],
            button[aria-label*="Navigation"],
            [class*="hamburger"],
            [class*="Hamburger"],
            [id*="hamburger"],
            [id*="Hamburger"] {
                margin-top: env(safe-area-inset-top, 44px) !important;
                position: relative !important;
                z-index: 1000 !important;
            }
        `);
    }

    // Complete the PWA setup after DOM is ready
    function completePWASetup() {
        // Check if site already has PWA capabilities
        if (isPWAEnabled()) {
            console.log('Site already has PWA capabilities');
            // Still apply our status bar fixes even for existing PWAs
            fixStatusBarHandling();
            return;
        }
    
        injectWebAppManifest();
        ensureIcons();
        optimizeCaching();
        fixStatusBarHandling();
    
        console.log('PWA capabilities enabled for: ' + window.location.hostname);
    }
  
    // Fix status bar handling for better usability
    function fixStatusBarHandling() {
        // Change status bar style to black (not translucent) for better content separation
        const statusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
        if (statusBarMeta) {
            statusBarMeta.content = 'black'; // Options: default, black, black-translucent
        }
      
        // Attempt to find and fix specific page elements that might be under the status bar
        setTimeout(() => {
            adjustTopElements();
        }, 500);
    }
  
    // Adjust elements that might be positioned at the top of the screen
    function adjustTopElements() {
        // Find elements that are likely to be at the top edge
        const topElements = document.querySelectorAll(
            'header, .header, nav.fixed, nav.sticky, .navbar.fixed, .navbar.sticky, ' +
            '.app-bar, .toolbar, .navigation-bar, [style*="position: fixed"], [style*="position:fixed"]'
        );
      
        topElements.forEach(el => {
            const styles = window.getComputedStyle(el);
            const topPosition = parseInt(styles.top);
          
            // If element is positioned at the top, adjust it
            if (topPosition === 0 &&
                (styles.position === 'fixed' || styles.position === 'sticky' || styles.position === 'absolute')) {
                el.style.top = 'env(safe-area-inset-top, 44px)';
                el.style.height = `calc(${styles.height} + env(safe-area-inset-top, 44px))`;
                el.style.paddingTop = 'env(safe-area-inset-top, 44px)';
            }
        });
    }

    // Check if site already has PWA capabilities
    function isPWAEnabled() {
        const hasPWAMetaTag = !!document.querySelector('meta[name="apple-mobile-web-app-capable"][content="yes"]');
        const hasManifest = !!document.querySelector('link[rel="manifest"]');
    
        return hasPWAMetaTag && hasManifest;
    }

    // Add iOS WebKit meta tags
    function addWebAppMetaTags() {
        const metaTags = [
            { name: 'apple-mobile-web-app-capable', content: 'yes' },
            { name: 'apple-mobile-web-app-status-bar-style', content: 'black' }, // Changed from black-translucent
            { name: 'mobile-web-app-capable', content: 'yes' },
            { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover' } // Added viewport-fit=cover
        ];
    
        metaTags.forEach(tag => {
            // Check if tag already exists
            const existingTag = document.querySelector(`meta[name="${tag.name}"]`);
            if (existingTag) {
                existingTag.content = tag.content; // Update content if needed
            } else {
                const metaTag = document.createElement('meta');
                metaTag.name = tag.name;
                metaTag.content = tag.content;
                document.head.appendChild(metaTag);
            }
        });
    
        // Add apple-mobile-web-app-title after document title is definitely available
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setAppTitle);
        } else {
            setAppTitle();
        }
    }

    // Set the app title
    function setAppTitle() {
        if (!document.querySelector('meta[name="apple-mobile-web-app-title"]')) {
            const titleTag = document.createElement('meta');
            titleTag.name = 'apple-mobile-web-app-title';
            titleTag.content = document.title || window.location.hostname;
            document.head.appendChild(titleTag);
        }
    }

    // Inject Web App Manifest
    function injectWebAppManifest() {
        // Check if manifest already exists
        if (document.querySelector('link[rel="manifest"]')) {
            return;
        }
    
        // Get icons from page
        const icons = extractIconsFromPage();
    
        // Create manifest content
        const manifest = {
            name: document.title || window.location.hostname,
            short_name: getShorterName(),
            description: document.querySelector('meta[name="description"]')?.content || `PWA for ${window.location.hostname}`,
            start_url: window.location.href,
            scope: window.location.origin,
            display: 'standalone',
            background_color: '#ffffff',
            theme_color: getThemeColor(),
            icons: icons.length > 0 ? icons : [{
                src: window.location.origin + '/favicon.ico',
                sizes: '128x128',
                type: 'image/x-icon'
            }]
        };
    
        // Create inline manifest using data URL
        const manifestJSON = JSON.stringify(manifest);
        const manifestB64 = btoa(unescape(encodeURIComponent(manifestJSON)));
        const dataURL = 'data:application/json;base64,' + manifestB64;
    
        // Add manifest link
        const link = document.createElement('link');
        link.rel = 'manifest';
        link.href = dataURL;
        document.head.appendChild(link);
    }

    // Get shorter name for PWA
    function getShorterName() {
        const title = document.title || window.location.hostname;
        // If title is already short, use it
        if (title.length <= 12) {
            return title;
        }
    
        // Try to extract a shorter name
        const h1 = document.querySelector('h1');
        if (h1 && h1.textContent.trim().length <= 12) {
            return h1.textContent.trim();
        }
    
        // Use hostname without TLD
        const hostname = window.location.hostname;
        const parts = hostname.split('.');
        if (parts.length >= 2) {
            return parts[parts.length - 2];
        }
    
        // Fallback to truncated title
        return title.substring(0, 12);
    }

    // Extract icons from the page
    function extractIconsFromPage() {
        const icons = [];
        const iconElements = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]');
    
        iconElements.forEach(icon => {
            let size = 192; // Default size
        
            // Try to extract size from the sizes attribute
            if (icon.sizes && icon.sizes.value !== '') {
                const sizeMatch = icon.sizes.value.match(/(\d+)x\d+/);
                if (sizeMatch) {
                    size = parseInt(sizeMatch[1]);
                }
            }
        
            icons.push({
                src: icon.href,
                sizes: `${size}x${size}`,
                type: icon.type || 'image/png'
            });
        });
    
        return icons;
    }

    // Ensure icons are available
    function ensureIcons() {
        // Check if we have any apple-touch-icon
        const hasAppleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]');
        if (!hasAppleTouchIcon) {
            // Look for best available icon
            const icons = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]');
        
            if (icons.length > 0) {
                // Use existing icon as apple-touch-icon
                const bestIcon = Array.from(icons).sort((a, b) => {
                    const sizeA = a.sizes ? parseInt(a.sizes.value) : 0;
                    const sizeB = b.sizes ? parseInt(b.sizes.value) : 0;
                    return sizeB - sizeA;
                })[0];
            
                const appleTouchIcon = document.createElement('link');
                appleTouchIcon.rel = 'apple-touch-icon';
                appleTouchIcon.href = bestIcon.href;
                document.head.appendChild(appleTouchIcon);
            } else {
                // Try with default favicon path
                const faviconPath = '/favicon.ico';
                const faviconURL = new URL(faviconPath, window.location.origin).href;
            
                const appleTouchIcon = document.createElement('link');
                appleTouchIcon.rel = 'apple-touch-icon';
                appleTouchIcon.href = faviconURL;
                document.head.appendChild(appleTouchIcon);
            }
        }
    
        // Add apple-touch-startup-image for splash screen
        if (!document.querySelector('link[rel="apple-touch-startup-image"]')) {
            const appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]')?.href ||
                                   document.querySelector('link[rel="icon"]')?.href ||
                                   new URL('/favicon.ico', window.location.origin).href;
                          
            const splashIcon = document.createElement('link');
            splashIcon.rel = 'apple-touch-startup-image';
            splashIcon.href = appleTouchIcon;
            document.head.appendChild(splashIcon);
        }
    }

    // Optimize caching behavior
    function optimizeCaching() {
        // For iOS PWA, we want to encourage caching
        if (!document.querySelector('meta[http-equiv="Cache-Control"]')) {
            const cacheControl = document.createElement('meta');
            cacheControl.httpEquiv = 'Cache-Control';
            cacheControl.content = 'public, max-age=86400';
            document.head.appendChild(cacheControl);
        }
    }

    // Get theme color from meta tag or compute from page
    function getThemeColor() {
        // Check if there's a theme-color meta tag
        const themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (themeColorMeta) {
            return themeColorMeta.content;
        }
    
        // Try to find prominent colors in the design
        const header = document.querySelector('header');
        if (header) {
            const headerStyle = window.getComputedStyle(header);
            if (headerStyle.backgroundColor && headerStyle.backgroundColor !== 'rgba(0, 0, 0, 0)') {
                return headerStyle.backgroundColor;
            }
        }
    
        // Default theme color
        return '#2196F3';
    }

    // Start the enablement process
    enablePWA();
})();