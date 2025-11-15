(function($) {
  'use strict';

  /**
   * LandingHeader class to handle the landing page header functionality
   */
  class LandingHeader {
    constructor() {
      this.init();
    }

    /**
     * Initialize the landing header
     */
    init() {
      this.bindEvents();
      this.setupAjaxDefaults();
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
      $('.login-btn').on('click', (e) => {
        e.preventDefault();
        this.handleLoginClick();
      });

      $('.signup-btn').on('click', (e) => {
        e.preventDefault();
        this.handleSignupClick();
      });
    }

    /**
     * Setup default AJAX settings
     */
    setupAjaxDefaults() {
      $.ajaxSetup({
        dataType: 'json',
        timeout: 10000,
        beforeSend: (xhr, settings) => {
          // Add CSRF token if needed
          if (!(/^http:.*/.test(settings.url) || /^https:.*/.test(settings.url))) {
            // Only send the token to relative URLs i.e. locally.
            xhr.setRequestHeader("X-CSRFToken", this.getCookie('csrftoken'));
          }
        }
      });
    }

    /**
     * Handle login button click
     */
    handleLoginClick() {
      const requestData = {
        action: 'login_redirect',
        timestamp: new Date().toISOString()
      };

      this.sendAjaxRequest('/api/auth/action/', requestData)
        .done((response) => {
          this.handleLoginSuccess(response);
        })
        .fail((jqXHR, textStatus, errorThrown) => {
          this.handleLoginError(jqXHR, textStatus, errorThrown);
        });
    }

    /**
     * Handle signup button click
     */
    handleSignupClick() {
      const requestData = {
        action: 'signup_redirect',
        timestamp: new Date().toISOString()
      };

      this.sendAjaxRequest('/api/auth/action/', requestData)
        .done((response) => {
          this.handleSignupSuccess(response);
        })
        .fail((jqXHR, textStatus, errorThrown) => {
          this.handleSignupError(jqXHR, textStatus, errorThrown);
        });
    }

    /**
     * Send AJAX request
     * @param {string} url - The URL to send the request to
     * @param {Object} data - The data to send
     * @returns {jqXHR} - The jQuery XMLHttpRequest object
     */
    sendAjaxRequest(url, data) {
      return $.ajax({
        url: url,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data)
      });
    }

    /**
     * Handle login success
     * @param {Object} response - The JSON response from the server
     */
    handleLoginSuccess(response) {
      if (response && response.redirect_url) {
        window.location.href = response.redirect_url;
      } else {
        console.log('Login action successful', response);
        // Default redirect if no URL provided in response
        window.location.href = '/auth/login';
      }
    }

    /**
     * Handle login error
     * @param {jqXHR} jqXHR - The jQuery XMLHttpRequest object
     * @param {string} textStatus - The status text
     * @param {string} errorThrown - The error thrown
     */
    handleLoginError(jqXHR, textStatus, errorThrown) {
      console.error('Login request failed:', textStatus, errorThrown);
      // Fallback redirect on error
      window.location.href = '/auth/login';
    }

    /**
     * Handle signup success
     * @param {Object} response - The JSON response from the server
     */
    handleSignupSuccess(response) {
      if (response && response.redirect_url) {
        window.location.href = response.redirect_url;
      } else {
        console.log('Signup action successful', response);
        // Default redirect if no URL provided in response
        window.location.href = '/auth/register';
      }
    }

    /**
     * Handle signup error
     * @param {jqXHR} jqXHR - The jQuery XMLHttpRequest object
     * @param {string} textStatus - The status text
     * @param {string} errorThrown - The error thrown
     */
    handleSignupError(jqXHR, textStatus, errorThrown) {
      console.error('Signup request failed:', textStatus, errorThrown);
      // Fallback redirect on error
      window.location.href = '/auth/register';
    }

    /**
     * Get cookie value by name
     * @param {string} name - The name of the cookie
     * @returns {string|null} - The cookie value or null if not found
     */
    getCookie(name) {
      let cookieValue = null;
      if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
          const cookie = cookies[i].trim();
          // Does this cookie string begin with the name we want?
          if (cookie.substring(0, name.length + 1) === (name + '=')) {
            cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
            break;
          }
        }
      }
      return cookieValue;
    }
  }

  // Initialize the LandingHeader when the DOM is ready
  $(document).ready(function() {
    new LandingHeader();
  });

})(jQuery);