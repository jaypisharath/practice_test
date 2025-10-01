/**
 * HTTP Client Module
 * Provides comprehensive HTTP request capabilities with error handling, retries, and logging
 */

class HttpClient {
  constructor(options = {}) {
    this.baseURL = options.baseURL || '';
    this.timeout = options.timeout || 10000; // 10 seconds default
    this.retries = options.retries || 3;
    this.retryDelay = options.retryDelay || 1000; // 1 second
    this.logging = options.logging || false;
  }

  /**
   * Log request/response for debugging
   */
  log(message, data = null) {
    if (this.logging) {
      console.log(`[HttpClient] ${message}`, data || '');
    }
  }

  /**
   * Sleep utility for retry delays
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Make HTTP request with retry logic
   */
  async makeRequest(method, url, options = {}) {
    const fullUrl = this.baseURL ? `${this.baseURL}${url}` : url;
    const requestOptions = {
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    // Remove body for GET and HEAD requests
    if (['GET', 'HEAD'].includes(requestOptions.method)) {
      delete requestOptions.body;
    }

    this.log(`Making ${method} request to ${fullUrl}`, requestOptions);

    let lastError;
    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        
        requestOptions.signal = controller.signal;

        const response = await fetch(fullUrl, requestOptions);
        clearTimeout(timeoutId);

        this.log(`Response received: ${response.status} ${response.statusText}`);

        // Handle HTTP errors
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Parse response based on content type
        const contentType = response.headers.get('content-type');
        let data;
        
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text();
        }

        this.log('Request successful', { status: response.status, data });
        return {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          data
        };

      } catch (error) {
        lastError = error;
        this.log(`Attempt ${attempt} failed:`, error.message);

        if (attempt < this.retries) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
          this.log(`Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    throw new Error(`Request failed after ${this.retries} attempts: ${lastError.message}`);
  }

  /**
   * GET request
   */
  async get(url, options = {}) {
    return this.makeRequest('GET', url, options);
  }

  /**
   * POST request
   */
  async post(url, data = null, options = {}) {
    const requestOptions = { ...options };
    if (data) {
      requestOptions.body = JSON.stringify(data);
    }
    return this.makeRequest('POST', url, requestOptions);
  }

  /**
   * PUT request
   */
  async put(url, data = null, options = {}) {
    const requestOptions = { ...options };
    if (data) {
      requestOptions.body = JSON.stringify(data);
    }
    return this.makeRequest('PUT', url, requestOptions);
  }

  /**
   * DELETE request
   */
  async delete(url, options = {}) {
    return this.makeRequest('DELETE', url, options);
  }

  /**
   * Test connectivity to a URL
   */
  async ping(url) {
    try {
      const response = await this.get(url);
      return {
        success: true,
        status: response.status,
        responseTime: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message.replace(/Request failed after \d+ attempts: /, '')
      };
    }
  }
}

module.exports = HttpClient;
