/**
 * FeedbackAPI - Client for interacting with the feedback proxy endpoints
 * Handles all communication with the auth server for feedback operations
 */
export class FeedbackAPI {
    constructor(baseUrl = null) {
        // Determine base URL based on environment
        if (baseUrl) {
            this.baseUrl = baseUrl;
        } else {
            // Use production URL if available, otherwise localhost for development
            this.baseUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:3303'
                : 'https://auth.tippy.dev';
        }

        this.apiPath = '/api/feedback';
        log("feedback-api", `Initialized FeedbackAPI with base URL: ${this.baseUrl}`);
    }

    /**
     * Make an HTTP request to the API
     * @private
     */
    async _request(endpoint, options = {}) {
        const url = `${this.baseUrl}${this.apiPath}${endpoint}`;

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Request failed');
            }

            return data;
        } catch (error) {
            err("feedback-api", `Request failed for ${endpoint}:`, error);
            throw error;
        }
    }

    /**
     * Create a new feedback ticket
     * @param {Object} feedback - Ticket data
     * @returns {Promise<Object>} Created ticket
     */
    async createTicket(feedback) {
        log("feedback-api", "Creating ticket:", feedback.ticketId);

        const response = await this._request('/tickets', {
            method: 'POST',
            body: JSON.stringify(feedback)
        });

        return response.ticket;
    }

    /**
     * Get a single ticket by ID
     * @param {string} ticketId - Ticket ID
     * @returns {Promise<Object>} Ticket data
     */
    async getTicket(ticketId) {
        log("feedback-api", "Fetching ticket:", ticketId);

        const response = await this._request(`/tickets/${ticketId}`, {
            method: 'GET'
        });

        return response.ticket;
    }

    /**
     * Get all tickets with optional filtering
     * @param {Object} filters - Optional filters (type, status, limit, offset)
     * @returns {Promise<Array>} Array of tickets
     */
    async getAllTickets(filters = {}) {
        log("feedback-api", "Fetching all tickets with filters:", filters);

        // Build query string from filters
        const queryParams = new URLSearchParams();
        if (filters.type) queryParams.append('type', filters.type);
        if (filters.status) queryParams.append('status', filters.status);
        if (filters.limit) queryParams.append('limit', filters.limit);
        if (filters.offset) queryParams.append('offset', filters.offset);

        const queryString = queryParams.toString();
        const endpoint = `/tickets${queryString ? '?' + queryString : ''}`;

        const response = await this._request(endpoint, {
            method: 'GET'
        });

        return response.tickets;
    }

    /**
     * Update a ticket
     * @param {string} ticketId - Ticket ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object>} Updated ticket
     */
    async updateTicket(ticketId, updates) {
        log("feedback-api", "Updating ticket:", ticketId, updates);

        const response = await this._request(`/tickets/${ticketId}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });

        return response.ticket;
    }

    /**
     * Delete a ticket
     * @param {string} ticketId - Ticket ID
     * @returns {Promise<void>}
     */
    async deleteTicket(ticketId) {
        log("feedback-api", "Deleting ticket:", ticketId);

        await this._request(`/tickets/${ticketId}`, {
            method: 'DELETE'
        });
    }

    /**
     * Add a comment to a ticket
     * @param {string} ticketId - Ticket ID
     * @param {Object} comment - Comment data (author, content)
     * @returns {Promise<Object>} Added comment with index
     */
    async addComment(ticketId, comment) {
        log("feedback-api", "Adding comment to ticket:", ticketId);

        const response = await this._request(`/tickets/${ticketId}/comments`, {
            method: 'POST',
            body: JSON.stringify(comment)
        });

        return {
            comment: response.comment,
            commentIndex: response.commentIndex
        };
    }

    /**
     * Update a comment
     * @param {string} ticketId - Ticket ID
     * @param {number} commentIndex - Comment index
     * @param {string} content - New comment content
     * @returns {Promise<Object>} Updated comment
     */
    async updateComment(ticketId, commentIndex, content) {
        log("feedback-api", "Updating comment:", ticketId, commentIndex);

        const response = await this._request(`/tickets/${ticketId}/comments/${commentIndex}`, {
            method: 'PUT',
            body: JSON.stringify({ content })
        });

        return response.comment;
    }

    /**
     * Delete a comment
     * @param {string} ticketId - Ticket ID
     * @param {number} commentIndex - Comment index
     * @returns {Promise<void>}
     */
    async deleteComment(ticketId, commentIndex) {
        log("feedback-api", "Deleting comment:", ticketId, commentIndex);

        await this._request(`/tickets/${ticketId}/comments/${commentIndex}`, {
            method: 'DELETE'
        });
    }
}
