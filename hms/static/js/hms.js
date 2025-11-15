/**
 * Global Configuration for Hospital Management System Frontend
 */
const CONFIG = {
    API_BASE_URL: '/api/v1',
    VERSION: '1.0.0',
    TIMEOUT: 30000,
    HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    AUTH_TOKEN_KEY: 'hms_auth_token'
};

/**
 * Cookie Utility Functions
 */
const CookieManager = {
    /**
     * Set a cookie
     * @param {string} name - Cookie name
     * @param {string} value - Cookie value
     * @param {number} days - Expiration in days
     */
    setCookie(name, value, days) {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/";
    },

    /**
     * Get a cookie value by name
     * @param {string} name - Cookie name
     * @returns {string|null} Cookie value or null
     */
    getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    },

    /**
     * Delete a cookie
     * @param {string} name - Cookie name
     */
    deleteCookie(name) {
        document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    },

    /**
     * Check if a cookie exists
     * @param {string} name - Cookie name
     * @returns {boolean} True if cookie exists
     */
    checkCookie(name) {
        return this.getCookie(name) !== null;
    }
};

/**
 * AjaxHandler Class for making HTTP requests
 */
class AjaxHandler {
    constructor() {
        this.retries = 3;
        this.retryDelay = 1000;
    }

    /**
     * Make an AJAX request
     * @param {string} method - HTTP method
     * @param {string} url - Request URL
     * @param {Object} data - Request data
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Response object
     */
    async request(method, url, data = null, options = {}) {
        const {
            retries = this.retries,
            retryDelay = this.retryDelay,
            timeout = CONFIG.TIMEOUT,
            headers = {}
        } = options;

        // Show loading indicator
        LoadingManager.showLoading();

        // Merge default headers with provided headers
        const defaultHeaders = { ...CONFIG.HEADERS, ...headers };
        
        // Add authentication token if available
        const token = CookieManager.getCookie(CONFIG.AUTH_TOKEN_KEY);
        if (token) {
            defaultHeaders['Authorization'] = `Bearer ${token}`;
        }

        // Add CSRF token if available
        const csrfToken = CookieManager.getCookie('csrftoken');
        if (csrfToken) {
            defaultHeaders['X-CSRFToken'] = csrfToken;
        }

        let attempt = 0;
        while (attempt <= retries) {
            try {
                const requestOptions = {
                    url: CONFIG.API_BASE_URL + url,
                    method: method,
                    timeout: timeout,
                    headers: defaultHeaders,
                    dataType: 'json'
                };

                if (data) {
                    if (data instanceof FormData) {
                        requestOptions.processData = false;
                        requestOptions.contentType = false;
                        requestOptions.data = data;
                    } else {
                        requestOptions.data = JSON.stringify(data);
                    }
                }

                const response = await $.ajax(requestOptions);
                
                // Hide loading indicator
                LoadingManager.hideLoading();
                
                return {
                    success: true,
                    data: response
                };
            } catch (error) {
                attempt++;
                if (attempt > retries) {
                    // Hide loading indicator
                    LoadingManager.hideLoading();
                    
                    return this.handleError(error);
                }
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }
    }

    /**
     * Handle AJAX errors
     * @param {Object} error - jQuery AJAX error object
     * @returns {Object} Standardized error object
     */
    handleError(error) {
        let message = 'An unexpected error occurred';
        
        if (error.responseJSON && error.responseJSON.detail) {
            message = error.responseJSON.detail;
        } else if (error.responseText) {
            try {
                const response = JSON.parse(error.responseText);
                if (response.detail) {
                    message = response.detail;
                }
            } catch (e) {
                // Try to parse JSON response from error.responseText
                message = 'An unexpected error occurred';
                if (error.responseText) {
                    try {
                        const response = JSON.parse(error.responseText);
                        if (response.detail) {
                            message = response.detail;
                        } else if (response.error) {
                            message = response.error;
                        } else if (typeof response === 'string') {
                            message = response;
                        } else if (typeof response === 'object') {
                            message = Object.values(response).join(', ') || message;
                        }
                    } catch (e) {
                        // If parsing fails, use status text or generic message
                        message = error.statusText || message;
                    }
                }

                // If parsing fails, use status text
                message = error.statusText || message;
            }
        } else if (error.statusText) {
            message = error.statusText;
        }

        // Special handling for common status codes
        switch (error.status) {
            case 401:
                message = 'Unauthorized access. Please log in.';
                // Optionally redirect to login page
                // window.location.href = '/login';
                break;
            case 403:
                message = 'Access forbidden. You do not have permission to perform this action.';
                break;
            case 404:
                message = 'Resource not found.';
                break;
            case 500:
                message = 'Internal server error. Please try again later.';
                break;
        }

        return {
            success: false,
            error: message,
            status: error.status
        };
    }

    /**
     * GET request
     * @param {string} url - Request URL
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Response object
     */
    get(url, options = {}) {
        return this.request('GET', url, null, options);
    }

    /**
     * POST request
     * @param {string} url - Request URL
     * @param {Object} data - Request data
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Response object
     */
    post(url, data, options = {}) {
        return this.request('POST', url, data, options);
    }

    /**
     * PUT request
     * @param {string} url - Request URL
     * @param {Object} data - Request data
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Response object
     */
    put(url, data, options = {}) {
        return this.request('PUT', url, data, options);
    }

    /**
     * DELETE request
     * @param {string} url - Request URL
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Response object
     */
    delete(url, options = {}) {
        return this.request('DELETE', url, null, options);
    }
}

/**
 * Notification System
 */
const NotificationManager = {
    container: null,

    /**
     * Initialize notification container
     */
    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'notification-container';
            this.container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                width: 300px;
            `;
            document.body.appendChild(this.container);
        }
    },

    /**
     * Show a notification
     * @param {string} type - Notification type (success, error, warning, info)
     * @param {string} message - Notification message
     * @param {number} duration - Auto-hide duration in milliseconds
     */
    show(type, message, duration = 5000) {
        this.init();
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'assertive');
        
        notification.style.cssText = `
            background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : type === 'warning' ? '#fff3cd' : '#d1ecf1'};
            color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : type === 'warning' ? '#856404' : '#0c5460'};
            border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : type === 'warning' ? '#ffeaa7' : '#bee5eb'};
            border-radius: 4px;
            padding: 15px;
            margin-bottom: 10px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            position: relative;
            opacity: 0;
            transform: translateY(-20px);
            transition: all 0.3s ease;
        `;
        
        notification.innerHTML = `
            <strong>${type.charAt(0).toUpperCase() + type.slice(1)}:</strong> ${message}
            <button class="notification-close" aria-label="Close notification" style="
                position: absolute;
                top: 5px;
                right: 10px;
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                color: inherit;
            ">&times;</button>
        `;
        
        this.container.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        }, 10);
        
        // Add close event
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.dismiss(notification);
        });
        
        // Auto-hide after duration
        if (duration > 0) {
            setTimeout(() => {
                this.dismiss(notification);
            }, duration);
        }
    },

    /**
     * Dismiss a notification
     * @param {HTMLElement} notification - Notification element to dismiss
     */
    dismiss(notification) {
        if (notification) {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                if (notification.parentNode === this.container) {
                    this.container.removeChild(notification);
                }
            }, 300);
        }
    },

    /**
     * Show success notification
     * @param {string} message - Notification message
     * @param {number} duration - Auto-hide duration
     */
    success(message, duration) {
        this.show('success', message, duration);
    },

    /**
     * Show error notification
     * @param {string} message - Notification message
     * @param {number} duration - Auto-hide duration
     */
    error(message, duration) {
        this.show('error', message, duration);
    },

    /**
     * Show warning notification
     * @param {string} message - Notification message
     * @param {number} duration - Auto-hide duration
     */
    warning(message, duration) {
        this.show('warning', message, duration);
    },

    /**
     * Show info notification
     * @param {string} message - Notification message
     * @param {number} duration - Auto-hide duration
     */
    info(message, duration) {
        this.show('info', message, duration);
    }
};

/**
 * Loading Manager
 */
const LoadingManager = {
    /**
     * Show loading indicator
     * @param {string|HTMLElement} target - Target element or 'page' for full page
     */
    showLoading(target = 'page') {
        if (target === 'page') {
            // Create overlay for full page
            if (!document.getElementById('loading-overlay')) {
                const overlay = document.createElement('div');
                overlay.id = 'loading-overlay';
                overlay.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(255, 255, 255, 0.7);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 9999;
                `;
                
                const spinner = document.createElement('div');
                spinner.className = 'spinner';
                spinner.style.cssText = `
                    width: 50px;
                    height: 50px;
                    border: 5px solid #f3f3f3;
                    border-top: 5px solid #3498db;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                `;
                
                overlay.appendChild(spinner);
                document.body.appendChild(overlay);
                
                // Add spinner animation
                const style = document.createElement('style');
                style.textContent = `
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `;
                document.head.appendChild(style);
            }
        } else {
            // Add loading class to specific element
            const element = typeof target === 'string' ? document.querySelector(target) : target;
            if (element) {
                element.classList.add('loading');
                element.disabled = true;
            }
        }
    },

    /**
     * Hide loading indicator
     * @param {string|HTMLElement} target - Target element or 'page' for full page
     */
    hideLoading(target = 'page') {
        if (target === 'page') {
            const overlay = document.getElementById('loading-overlay');
            if (overlay) {
                overlay.remove();
            }
        } else {
            const element = typeof target === 'string' ? document.querySelector(target) : target;
            if (element) {
                element.classList.remove('loading');
                element.disabled = false;
            }
        }
    }
};

/**
 * Form Utilities
 */
const FormUtils = {
    /**
     * Serialize form data to JSON object
     * @param {HTMLFormElement} form - Form element
     * @returns {Object} Serialized form data
     */
    serializeForm(form) {
        const formData = new FormData(form);
        const jsonData = {};
        
        for (const [key, value] of formData.entries()) {
            if (jsonData[key]) {
                if (Array.isArray(jsonData[key])) {
                    jsonData[key].push(value);
                } else {
                    jsonData[key] = [jsonData[key], value];
                }
            } else {
                jsonData[key] = value;
            }
        }
        
        return jsonData;
    },

    /**
     * Validate required fields
     * @param {Array<string>} requiredFields - Array of field names
     * @param {HTMLFormElement} form - Form element
     * @returns {boolean} True if all fields are valid
     */
    validate(requiredFields, form) {
        let isValid = true;
        
        requiredFields.forEach(fieldName => {
            const field = form.elements[fieldName];
            if (field) {
                if (!field.value.trim()) {
                    field.classList.add('error');
                    isValid = false;
                } else {
                    field.classList.remove('error');
                }
            }
        });
        
        return isValid;
    },

    /**
     * Attach submit handler to form
     * @param {HTMLFormElement} form - Form element
     * @param {Function} callback - Submit callback
     */
    attachSubmit(form, callback) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Check if form has data-ajax attribute
            if (form.dataset.ajax === 'true') {
                const submitBtn = form.querySelector('[type="submit"]');
                const originalText = submitBtn ? submitBtn.textContent : null;
                
                try {
                    // Show loading on submit button
                    if (submitBtn) {
                        submitBtn.textContent = 'Saving...';
                        submitBtn.disabled = true;
                    }
                    
                    const data = this.serializeForm(form);
                    const result = await callback(data, form);
                    
                    if (result.success) {
                        NotificationManager.success(result.message || 'Operation completed successfully');
                        form.reset();
                    } else {
                        NotificationManager.error(result.error || 'Operation failed');
                    }
                } catch (error) {
                    NotificationManager.error('An unexpected error occurred');
                } finally {
                    // Restore submit button
                    if (submitBtn) {
                        submitBtn.textContent = originalText;
                        submitBtn.disabled = false;
                    }
                }
            } else {
                callback(new FormData(form), form);
            }
        });
    },

    /**
     * Disable form
     * @param {HTMLFormElement} form - Form element
     */
    disableForm(form) {
        const elements = form.elements;
        for (let i = 0; i < elements.length; i++) {
            elements[i].disabled = true;
        }
    },

    /**
     * Enable form
     * @param {HTMLFormElement} form - Form element
     */
    enableForm(form) {
        const elements = form.elements;
        for (let i = 0; i < elements.length; i++) {
            elements[i].disabled = false;
        }
    }
};

/**
 * Input Helpers
 */
const InputHelpers = {
    /**
     * Limit characters in input field
     * @param {HTMLInputElement} input - Input element
     * @param {number} maxLength - Maximum length
     */
    limitCharacters(input, maxLength) {
        input.addEventListener('input', () => {
            if (input.value.length > maxLength) {
                input.value = input.value.substring(0, maxLength);
            }
        });
    },

    /**
     * Allow only numeric input
     * @param {HTMLInputElement} input - Input element
     */
    numericOnly(input) {
        input.addEventListener('keypress', (e) => {
            if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'Enter'].includes(e.key)) {
                e.preventDefault();
            }
        });
    },

    /**
     * Email format validation
     * @param {HTMLInputElement} input - Input element
     */
    emailFormatCheck(input) {
        input.addEventListener('blur', () => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (input.value && !emailRegex.test(input.value)) {
                input.classList.add('error');
                NotificationManager.warning('Please enter a valid email address');
            } else {
                input.classList.remove('error');
            }
        });
    },

    /**
     * Live validation for input fields
     * @param {HTMLInputElement} input - Input element
     * @param {RegExp} pattern - Validation pattern
     * @param {string} errorMessage - Error message
     */
    liveValidation(input, pattern, errorMessage) {
        input.addEventListener('input', () => {
            if (pattern.test(input.value)) {
                input.classList.remove('error');
            } else {
                input.classList.add('error');
            }
        });
        
        input.addEventListener('blur', () => {
            if (input.value && !pattern.test(input.value)) {
                NotificationManager.warning(errorMessage);
            }
        });
    }
};

/**
 * DOM Utilities
 */
const DOMUtils = {
    /**
     * Query selector shortcut
     * @param {string} selector - CSS selector
     * @param {HTMLElement} context - Context element
     * @returns {HTMLElement} First matching element
     */
    $(selector, context = document) {
        return context.querySelector(selector);
    },

    /**
     * Query selector all shortcut
     * @param {string} selector - CSS selector
     * @param {HTMLElement} context - Context element
     * @returns {NodeList} All matching elements
     */
    $$(selector, context = document) {
        return context.querySelectorAll(selector);
    },

    /**
     * Add CSS class to element
     * @param {HTMLElement} element - Target element
     * @param {string} className - Class name to add
     */
    addClass(element, className) {
        element.classList.add(className);
    },

    /**
     * Remove CSS class from element
     * @param {HTMLElement} element - Target element
     * @param {string} className - Class name to remove
     */
    removeClass(element, className) {
        element.classList.remove(className);
    },

    /**
     * Toggle CSS class on element
     * @param {HTMLElement} element - Target element
     * @param {string} className - Class name to toggle
     */
    toggleClass(element, className) {
        element.classList.toggle(className);
    },

    /**
     * Fade in element
     * @param {HTMLElement} element - Element to fade in
     * @param {number} duration - Animation duration in ms
     */
    fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';
        
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            element.style.opacity = progress.toString();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    },

    /**
     * Fade out element
     * @param {HTMLElement} element - Element to fade out
     * @param {number} duration - Animation duration in ms
     */
    fadeOut(element, duration = 300) {
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            element.style.opacity = (1 - progress).toString();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.style.display = 'none';
            }
        };
        
        requestAnimationFrame(animate);
    },

    /**
     * Slide up element
     * @param {HTMLElement} element - Element to slide up
     * @param {number} duration - Animation duration in ms
     */
    slideUp(element, duration = 300) {
        const startHeight = element.offsetHeight;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            element.style.height = (startHeight * (1 - progress)) + 'px';
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.style.display = 'none';
                element.style.height = '';
            }
        };
        
        requestAnimationFrame(animate);
    },

    /**
     * Slide down element
     * @param {HTMLElement} element - Element to slide down
     * @param {number} duration - Animation duration in ms
     */
    slideDown(element, duration = 300) {
        element.style.display = 'block';
        const targetHeight = element.offsetHeight;
        element.style.height = '0px';
        
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            element.style.height = (targetHeight * progress) + 'px';
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.style.height = '';
            }
        };
        
        requestAnimationFrame(animate);
    },

    /**
     * Create element from HTML string
     * @param {string} html - HTML string
     * @returns {HTMLElement} Created element
     */
    createElement(html) {
        const template = document.createElement('template');
        template.innerHTML = html.trim();
        return template.content.firstChild;
    }
};

/**
 * Global State Manager
 */
class StateManager {
    constructor() {
        this.state = {};
        this.listeners = {};
    }

    /**
     * Store value in state
     * @param {string} key - State key
     * @param {*} value - State value
     */
    store(key, value) {
        this.state[key] = value;
        this.publish(key, value);
    }

    /**
     * Get value from state
     * @param {string} key - State key
     * @returns {*} State value
     */
    get(key) {
        return this.state[key];
    }

    /**
     * Remove key from state
     * @param {string} key - State key
     */
    remove(key) {
        delete this.state[key];
        this.publish(key, undefined);
    }

    /**
     * Clear all state
     */
    clear() {
        this.state = {};
        // Notify all listeners
        for (const key in this.listeners) {
            this.publish(key, undefined);
        }
    }

    /**
     * Subscribe to state changes
     * @param {string} key - State key
     * @param {Function} callback - Callback function
     */
    subscribe(key, callback) {
        if (!this.listeners[key]) {
            this.listeners[key] = [];
        }
        this.listeners[key].push(callback);
    }

    /**
     * Unsubscribe from state changes
     * @param {string} key - State key
     * @param {Function} callback - Callback function
     */
    unsubscribe(key, callback) {
        if (this.listeners[key]) {
            this.listeners[key] = this.listeners[key].filter(cb => cb !== callback);
        }
    }

    /**
     * Publish state change
     * @param {string} key - State key
     * @param {*} value - New value
     */
    publish(key, value) {
        if (this.listeners[key]) {
            this.listeners[key].forEach(callback => callback(value));
        }
    }
}

/**
 * Animation Helper
 */
const AnimationHelper = {
    /**
     * Animate number counter
     * @param {HTMLElement} element - Target element
     * @param {number} start - Start value
     * @param {number} end - End value
     * @param {number} duration - Animation duration in ms
     */
    animateNumber(element, start, end, duration = 1000) {
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const current = Math.floor(start + (end - start) * progress);
            element.textContent = current.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.textContent = end.toLocaleString();
            }
        };
        
        requestAnimationFrame(animate);
    },

    /**
     * Smooth scroll to element
     * @param {string|HTMLElement} target - Target element or selector
     * @param {number} duration - Animation duration in ms
     */
    smoothScrollTo(target, duration = 1000) {
        const targetElement = typeof target === 'string' ? document.querySelector(target) : target;
        if (!targetElement) return;
        
        const targetPosition = targetElement.offsetTop;
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease-out function
            const ease = 1 - Math.pow(1 - progress, 3);
            
            window.scrollTo(0, startPosition + distance * ease);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    },

    /**
     * Create ripple effect
     * @param {Event} event - Click event
     * @param {HTMLElement} element - Target element
     */
    rippleEffect(event, element) {
        const ripple = document.createElement('span');
        ripple.classList.add('ripple');
        
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.7);
            transform: translate(${x}px, ${y}px);
            animation: ripple-animation 0.6s linear;
            pointer-events: none;
        `;
        
        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);
        
        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes ripple-animation {
                to {
                    transform: scale(2);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
        
        // Remove ripple after animation
        setTimeout(() => {
            ripple.remove();
            style.remove();
        }, 600);
    }
};

// Initialize global components
const ajaxHandler = new AjaxHandler();
const stateManager = new StateManager();

// Auto-bind forms with data-ajax="true"
document.addEventListener('DOMContentLoaded', () => {
    // Bind AJAX forms
    const ajaxForms = DOMUtils.$$('form[data-ajax="true"]');
    ajaxForms.forEach(form => {
        FormUtils.attachSubmit(form, async (data) => {
            const action = form.action || form.dataset.action;
            const method = form.method || 'POST';
            
            if (!action) {
                NotificationManager.error('Form action is not defined');
                return { success: false, error: 'Form action is not defined' };
            }
            
            let result;
            switch (method.toUpperCase()) {
                case 'POST':
                    result = await ajaxHandler.post(action, data);
                    break;
                case 'PUT':
                    result = await ajaxHandler.put(action, data);
                    break;
                case 'DELETE':
                    result = await ajaxHandler.delete(action);
                    break;
                default:
                    result = await ajaxHandler.get(action);
            }
            
            return result;
        });
    });
    
    // Bind delete buttons with data-delete="true"
    const deleteButtons = DOMUtils.$$('button[data-delete="true"], a[data-delete="true"]');
    deleteButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            
            const url = button.dataset.url;
            const confirmMessage = button.dataset.confirm || 'Are you sure you want to delete this item?';
            
            if (!url) {
                NotificationManager.error('Delete URL is not defined');
                return;
            }
            
            if (confirm(confirmMessage)) {
                const result = await ajaxHandler.delete(url);
                
                if (result.success) {
                    NotificationManager.success(result.message || 'Item deleted successfully');
                    // Optionally remove the element from DOM
                    if (button.dataset.target) {
                        const target = DOMUtils.$(button.dataset.target);
                        if (target) {
                            target.remove();
                        }
                    }
                } else {
                    NotificationManager.error(result.error || 'Failed to delete item');
                }
            }
        });
    });
});


