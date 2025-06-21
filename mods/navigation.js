// ==UserScript==
// @name         Arrow Key Element Navigation
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Navigate between clickable elements using arrow keys with auto-scroll
// @author       YourName
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Configuration
    const config = {
        highlightStyle: {
            outline: '2px solid #f00',
            outlineOffset: '2px',
            transition: 'outline 0.1s ease'
        },
        scrollPadding: 50 // pixels to pad when scrolling to element
    };

    // State
    let currentIndex = -1;
    let focusableElements = [];
    let isInitialized = false;

    // Initialize the navigation
    function initNavigation() {
        if (isInitialized) return;
        isInitialized = true;

        // Get all focusable elements
        focusableElements = getFocusableElements();

        // Add highlight style to document
        addHighlightStyle();

        // Add event listeners
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('click', handleClick);
        document.addEventListener('scroll', handleScroll);

        // Watch for DOM changes to update focusable elements
        observeDOMChanges();

        console.log('Arrow Key Navigation initialized. Found', focusableElements.length, 'focusable elements.');
    }

    // Get all focusable elements
    function getFocusableElements() {
        const selectors = [
            'a[href]',
            'button',
            'input',
            'select',
            'textarea',
            '[tabindex]',
            '[contenteditable]',
            '[onclick]'
        ].join(', ');

        const elements = Array.from(document.querySelectorAll(selectors))
            .filter(el => {
                // Skip hidden, disabled, or negative tabindex elements
                if (el.offsetParent === null || el.disabled ||
                    (el.tabIndex && el.tabIndex < 0)) {
                    return false;
                }

                // Check if element is visually in the viewport
                const rect = el.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0;
            })
            .sort((a, b) => {
                // Sort by vertical position, then horizontal
                const rectA = a.getBoundingClientRect();
                const rectB = b.getBoundingClientRect();

                if (Math.abs(rectA.top - rectB.top) < 10) {
                    return rectA.left - rectB.left;
                }
                return rectA.top - rectB.top;
            });

        return elements;
    }

    // Add highlight style to document
    function addHighlightStyle() {
        const style = document.createElement('style');
        style.textContent = `
            .arrow-key-nav-highlight {
                outline: ${config.highlightStyle.outline} !important;
                outline-offset: ${config.highlightStyle.outlineOffset} !important;
                transition: ${config.highlightStyle.transition} !important;
            }
        `;
        document.head.appendChild(style);
    }

    // Handle keyboard navigation
    function handleKeyDown(e) {
        // Only handle arrow keys
        if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) {
            return;
        }

        // Initialize on first arrow key press
        if (!isInitialized) {
            initNavigation();
        }

        // Prevent default scrolling behavior
        e.preventDefault();
        e.stopPropagation();

        // Remove highlight from current element
        if (currentIndex >= 0 && currentIndex < focusableElements.length) {
            focusableElements[currentIndex].classList.remove('arrow-key-nav-highlight');
        }

        // Handle key presses
        switch (e.key) {
            case 'ArrowDown':
                navigateVertical(1); // Down
                break;
            case 'ArrowUp':
                navigateVertical(-1); // Up
                break;
            case 'ArrowRight':
                navigateHorizontal(1); // Right
                break;
            case 'ArrowLeft':
                navigateHorizontal(-1); // Left
                break;
            case 'Enter':
                if (currentIndex >= 0 && currentIndex < focusableElements.length) {
                    focusableElements[currentIndex].click();
                }
                break;
        }

        // Add highlight to new current element
        if (currentIndex >= 0 && currentIndex < focusableElements.length) {
            const element = focusableElements[currentIndex];
            element.classList.add('arrow-key-nav-highlight');
            scrollToElement(element);
        }
    }

    // Navigate vertically
    function navigateVertical(direction) {
        if (focusableElements.length === 0) return;

        // If no current selection, start at first/last element
        if (currentIndex < 0 || currentIndex >= focusableElements.length) {
            currentIndex = direction > 0 ? 0 : focusableElements.length - 1;
            return;
        }

        const currentRect = focusableElements[currentIndex].getBoundingClientRect();
        const currentCenterY = currentRect.top + currentRect.height / 2;
        const currentCenterX = currentRect.left + currentRect.width / 2;

        let bestCandidate = null;
        let bestDistance = Infinity;
        let bestVerticalDistance = Infinity;

        for (let i = 0; i < focusableElements.length; i++) {
            if (i === currentIndex) continue;

            const rect = focusableElements[i].getBoundingClientRect();
            const centerY = rect.top + rect.height / 2;
            const centerX = rect.left + rect.width / 2;

            // Only consider elements in the desired direction
            if ((direction > 0 && centerY <= currentCenterY) ||
                (direction < 0 && centerY >= currentCenterY)) {
                continue;
            }

            const verticalDistance = Math.abs(centerY - currentCenterY);
            const horizontalDistance = Math.abs(centerX - currentCenterX);

            // Prefer elements that are more vertically aligned
            if (verticalDistance < bestVerticalDistance ||
                (verticalDistance === bestVerticalDistance && horizontalDistance < bestDistance)) {
                bestCandidate = i;
                bestDistance = horizontalDistance;
                bestVerticalDistance = verticalDistance;
            }
        }

        if (bestCandidate !== null) {
            currentIndex = bestCandidate;
        } else {
            // Wrap around if no element found in direction
            currentIndex = direction > 0 ? 0 : focusableElements.length - 1;
        }
    }

    // Navigate horizontally
    function navigateHorizontal(direction) {
        if (focusableElements.length === 0) return;

        // If no current selection, start at first/last element
        if (currentIndex < 0 || currentIndex >= focusableElements.length) {
            currentIndex = direction > 0 ? 0 : focusableElements.length - 1;
            return;
        }

        const currentRect = focusableElements[currentIndex].getBoundingClientRect();
        const currentCenterX = currentRect.left + currentRect.width / 2;
        const currentCenterY = currentRect.top + currentRect.height / 2;

        let bestCandidate = null;
        let bestDistance = Infinity;
        let bestHorizontalDistance = Infinity;

        for (let i = 0; i < focusableElements.length; i++) {
            if (i === currentIndex) continue;

            const rect = focusableElements[i].getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            // Only consider elements in similar vertical position
            if (Math.abs(centerY - currentCenterY) > currentRect.height * 0.5) {
                continue;
            }

            // Only consider elements in the desired direction
            if ((direction > 0 && centerX <= currentCenterX) ||
                (direction < 0 && centerX >= currentCenterX)) {
                continue;
            }

            const horizontalDistance = Math.abs(centerX - currentCenterX);
            const verticalDistance = Math.abs(centerY - currentCenterY);

            // Prefer elements that are more horizontally aligned
            if (horizontalDistance < bestHorizontalDistance ||
                (horizontalDistance === bestHorizontalDistance && verticalDistance < bestDistance)) {
                bestCandidate = i;
                bestDistance = verticalDistance;
                bestHorizontalDistance = horizontalDistance;
            }
        }

        if (bestCandidate !== null) {
            currentIndex = bestCandidate;
        }
    }

    // Scroll to ensure element is visible
    function scrollToElement(element) {
        const rect = element.getBoundingClientRect();
        const elementTop = rect.top + window.pageYOffset;
        const elementBottom = rect.bottom + window.pageYOffset;
        const viewportTop = window.pageYOffset;
        const viewportBottom = viewportTop + window.innerHeight;

        if (rect.top < config.scrollPadding) {
            // Element is above viewport or too close to top
            window.scrollTo({
                top: elementTop - config.scrollPadding,
                behavior: 'smooth'
            });
        } else if (rect.bottom > window.innerHeight - config.scrollPadding) {
            // Element is below viewport or too close to bottom
            window.scrollTo({
                top: elementBottom - window.innerHeight + config.scrollPadding,
                behavior: 'smooth'
            });
        }
    }

    // Handle click events to reset navigation
    function handleClick() {
        if (currentIndex >= 0 && currentIndex < focusableElements.length) {
            focusableElements[currentIndex].classList.remove('arrow-key-nav-highlight');
        }
        currentIndex = -1;
    }

    // Handle scroll events to update element positions
    function handleScroll() {
        // Re-sort elements after scrolling
        focusableElements.sort((a, b) => {
            const rectA = a.getBoundingClientRect();
            const rectB = b.getBoundingClientRect();

            if (Math.abs(rectA.top - rectB.top) < 10) {
                return rectA.left - rectB.left;
            }
            return rectA.top - rectB.top;
        });
    }

    // Observe DOM changes to update focusable elements
    function observeDOMChanges() {
        const observer = new MutationObserver(() => {
            focusableElements = getFocusableElements();
            if (currentIndex >= focusableElements.length) {
                currentIndex = -1;
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class', 'href', 'disabled', 'tabindex']
        });
    }

    // Initialize on DOM ready
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(initNavigation, 1);
    } else {
        document.addEventListener('DOMContentLoaded', initNavigation);
    }
})();
