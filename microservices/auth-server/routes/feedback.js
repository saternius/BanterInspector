const express = require('express');
const router = express.Router();

// Validation middleware
const validateTicketType = (type) => {
    const validTypes = ['bug', 'feature', 'improvement'];
    return validTypes.includes(type);
};

const validateTicketStatus = (status) => {
    const validStatuses = ['open', 'in-progress', 'closed', 'resolved'];
    return validStatuses.includes(status);
};

const sanitizeString = (str, maxLength = 10000) => {
    if (typeof str !== 'string') return '';
    return str.trim().substring(0, maxLength);
};

const validateTicketId = (ticketId) => {
    // Format: TYPE_YYYYMMDD_XXXX
    const pattern = /^(BUG|FEAT|IDEA)_\d{8}_\d{4}$/;
    return pattern.test(ticketId);
};

// Error response helper
const errorResponse = (res, statusCode, message, code) => {
    console.error(`Error [${code}]: ${message}`);
    return res.status(statusCode).json({
        success: false,
        error: message,
        code: code
    });
};

// POST /api/feedback/tickets - Create new ticket
router.post('/tickets', async (req, res) => {
    console.log('POST /api/feedback/tickets - Creating new ticket');

    try {
        const { type, title, details, inspector_version, user_agent, createdBy, ticketId, status } = req.body;

        // Validate required fields
        if (!type || !details || !createdBy || !ticketId) {
            return errorResponse(res, 400, 'Missing required fields: type, details, createdBy, ticketId', 'INVALID_INPUT');
        }

        // Validate type
        if (!validateTicketType(type)) {
            return errorResponse(res, 400, 'Invalid ticket type. Must be bug, feature, or improvement', 'INVALID_INPUT');
        }

        // Validate ticket ID format
        if (!validateTicketId(ticketId)) {
            return errorResponse(res, 400, 'Invalid ticket ID format', 'INVALID_INPUT');
        }

        // Validate status if provided
        if (status && !validateTicketStatus(status)) {
            return errorResponse(res, 400, 'Invalid status', 'INVALID_INPUT');
        }

        // Sanitize inputs
        const sanitizedTicket = {
            type: sanitizeString(type, 20),
            title: sanitizeString(title, 200),
            details: sanitizeString(details, 10000),
            inspector_version: sanitizeString(inspector_version, 50),
            user_agent: sanitizeString(user_agent, 500),
            createdBy: sanitizeString(createdBy, 100),
            ticketId: sanitizeString(ticketId, 50),
            status: status ? sanitizeString(status, 20) : 'open',
            timestamp: new Date().toISOString()
        };

        // Get Firebase Admin reference
        const admin = req.app.get('admin');
        const db = admin.database();

        // Check if ticket already exists
        const existingTicket = await db.ref(`feedback/tickets/${ticketId}`).once('value');
        if (existingTicket.exists()) {
            return errorResponse(res, 409, 'Ticket with this ID already exists', 'TICKET_EXISTS');
        }

        // Save to Firebase
        await db.ref(`feedback/tickets/${ticketId}`).set({
            ...sanitizedTicket,
            createdAt: admin.database.ServerValue.TIMESTAMP
        });

        console.log(`Ticket created successfully: ${ticketId}`);

        res.json({
            success: true,
            ticketId: ticketId,
            ticket: sanitizedTicket
        });

    } catch (error) {
        console.error('Error creating ticket:', error);
        return errorResponse(res, 500, 'Failed to create ticket', 'SERVER_ERROR');
    }
});

// GET /api/feedback/tickets - List all tickets
router.get('/tickets', async (req, res) => {
    console.log('GET /api/feedback/tickets - Fetching all tickets');

    try {
        const { type, status, limit, offset } = req.query;

        // Get Firebase Admin reference
        const admin = req.app.get('admin');
        const db = admin.database();

        // Fetch all tickets
        const snapshot = await db.ref('feedback/tickets').once('value');
        let tickets = [];

        snapshot.forEach(childSnapshot => {
            tickets.push({
                id: childSnapshot.key,
                ticketId: childSnapshot.key,
                ...childSnapshot.val()
            });
        });

        // Apply filters
        if (type && validateTicketType(type)) {
            tickets = tickets.filter(t => t.type === type);
        }

        if (status && validateTicketStatus(status)) {
            tickets = tickets.filter(t => t.status === status);
        }

        // Sort by creation date (newest first)
        tickets.sort((a, b) => {
            const dateA = new Date(a.createdAt || a.timestamp);
            const dateB = new Date(b.createdAt || b.timestamp);
            return dateB - dateA;
        });

        // Apply pagination
        const total = tickets.length;
        const offsetNum = parseInt(offset) || 0;
        const limitNum = parseInt(limit) || total;

        tickets = tickets.slice(offsetNum, offsetNum + limitNum);

        console.log(`Fetched ${tickets.length} tickets (total: ${total})`);

        res.json({
            success: true,
            tickets: tickets,
            total: total
        });

    } catch (error) {
        console.error('Error fetching tickets:', error);
        return errorResponse(res, 500, 'Failed to fetch tickets', 'SERVER_ERROR');
    }
});

// GET /api/feedback/tickets/:ticketId - Get single ticket
router.get('/tickets/:ticketId', async (req, res) => {
    const { ticketId } = req.params;
    console.log(`GET /api/feedback/tickets/${ticketId} - Fetching ticket`);

    try {
        // Validate ticket ID
        if (!validateTicketId(ticketId)) {
            return errorResponse(res, 400, 'Invalid ticket ID format', 'INVALID_INPUT');
        }

        // Get Firebase Admin reference
        const admin = req.app.get('admin');
        const db = admin.database();

        // Fetch ticket
        const snapshot = await db.ref(`feedback/tickets/${ticketId}`).once('value');

        if (!snapshot.exists()) {
            return errorResponse(res, 404, 'Ticket not found', 'TICKET_NOT_FOUND');
        }

        const ticket = {
            id: ticketId,
            ticketId: ticketId,
            ...snapshot.val()
        };

        console.log(`Ticket fetched successfully: ${ticketId}`);

        res.json({
            success: true,
            ticket: ticket
        });

    } catch (error) {
        console.error('Error fetching ticket:', error);
        return errorResponse(res, 500, 'Failed to fetch ticket', 'SERVER_ERROR');
    }
});

// PUT /api/feedback/tickets/:ticketId - Update ticket
router.put('/tickets/:ticketId', async (req, res) => {
    const { ticketId } = req.params;
    console.log(`PUT /api/feedback/tickets/${ticketId} - Updating ticket`);

    try {
        const { details, status, type } = req.body;

        // Validate ticket ID
        if (!validateTicketId(ticketId)) {
            return errorResponse(res, 400, 'Invalid ticket ID format', 'INVALID_INPUT');
        }

        // Get Firebase Admin reference
        const admin = req.app.get('admin');
        const db = admin.database();

        // Check if ticket exists
        const ticketRef = db.ref(`feedback/tickets/${ticketId}`);
        const snapshot = await ticketRef.once('value');

        if (!snapshot.exists()) {
            return errorResponse(res, 404, 'Ticket not found', 'TICKET_NOT_FOUND');
        }

        const currentData = snapshot.val();
        const updates = {};

        // Validate and sanitize updates
        if (details !== undefined) {
            updates.details = sanitizeString(details, 10000);
        }

        if (status !== undefined) {
            if (!validateTicketStatus(status)) {
                return errorResponse(res, 400, 'Invalid status', 'INVALID_INPUT');
            }
            updates.status = sanitizeString(status, 20);
        }

        if (type !== undefined) {
            if (!validateTicketType(type)) {
                return errorResponse(res, 400, 'Invalid ticket type', 'INVALID_INPUT');
            }
            updates.type = sanitizeString(type, 20);
        }

        // Add update metadata
        updates.updatedAt = new Date().toISOString();
        updates.editedAt = new Date().toISOString();

        // Merge with existing data
        await ticketRef.set({
            ...currentData,
            ...updates
        });

        const updatedTicket = {
            ...currentData,
            ...updates
        };

        console.log(`Ticket updated successfully: ${ticketId}`);

        res.json({
            success: true,
            ticket: updatedTicket
        });

    } catch (error) {
        console.error('Error updating ticket:', error);
        return errorResponse(res, 500, 'Failed to update ticket', 'SERVER_ERROR');
    }
});

// DELETE /api/feedback/tickets/:ticketId - Delete ticket
router.delete('/tickets/:ticketId', async (req, res) => {
    const { ticketId } = req.params;
    console.log(`DELETE /api/feedback/tickets/${ticketId} - Deleting ticket`);

    try {
        // Validate ticket ID
        if (!validateTicketId(ticketId)) {
            return errorResponse(res, 400, 'Invalid ticket ID format', 'INVALID_INPUT');
        }

        // Get Firebase Admin reference
        const admin = req.app.get('admin');
        const db = admin.database();

        // Check if ticket exists
        const ticketRef = db.ref(`feedback/tickets/${ticketId}`);
        const snapshot = await ticketRef.once('value');

        if (!snapshot.exists()) {
            return errorResponse(res, 404, 'Ticket not found', 'TICKET_NOT_FOUND');
        }

        // Delete ticket
        await ticketRef.remove();

        console.log(`Ticket deleted successfully: ${ticketId}`);

        res.json({
            success: true,
            message: 'Ticket deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting ticket:', error);
        return errorResponse(res, 500, 'Failed to delete ticket', 'SERVER_ERROR');
    }
});

// POST /api/feedback/tickets/:ticketId/comments - Add comment
router.post('/tickets/:ticketId/comments', async (req, res) => {
    const { ticketId } = req.params;
    console.log(`POST /api/feedback/tickets/${ticketId}/comments - Adding comment`);

    try {
        const { author, content } = req.body;

        // Validate required fields
        if (!author || !content) {
            return errorResponse(res, 400, 'Missing required fields: author, content', 'INVALID_INPUT');
        }

        // Validate ticket ID
        if (!validateTicketId(ticketId)) {
            return errorResponse(res, 400, 'Invalid ticket ID format', 'INVALID_INPUT');
        }

        // Sanitize inputs
        const sanitizedComment = {
            author: sanitizeString(author, 100),
            content: sanitizeString(content, 5000),
            timestamp: new Date().toISOString()
        };

        // Get Firebase Admin reference
        const admin = req.app.get('admin');
        const db = admin.database();

        // Check if ticket exists and get current data
        const ticketRef = db.ref(`feedback/tickets/${ticketId}`);
        const snapshot = await ticketRef.once('value');

        if (!snapshot.exists()) {
            return errorResponse(res, 404, 'Ticket not found', 'TICKET_NOT_FOUND');
        }

        const currentData = snapshot.val();
        const currentComments = currentData.comments || [];

        // Add new comment
        const updatedComments = [...currentComments, sanitizedComment];

        // Update ticket with new comments
        await ticketRef.set({
            ...currentData,
            comments: updatedComments,
            updatedAt: new Date().toISOString()
        });

        console.log(`Comment added successfully to ticket: ${ticketId}`);

        res.json({
            success: true,
            comment: sanitizedComment,
            commentIndex: updatedComments.length - 1
        });

    } catch (error) {
        console.error('Error adding comment:', error);
        return errorResponse(res, 500, 'Failed to add comment', 'SERVER_ERROR');
    }
});

// PUT /api/feedback/tickets/:ticketId/comments/:index - Edit comment
router.put('/tickets/:ticketId/comments/:index', async (req, res) => {
    const { ticketId, index } = req.params;
    console.log(`PUT /api/feedback/tickets/${ticketId}/comments/${index} - Editing comment`);

    try {
        const { content } = req.body;

        // Validate required fields
        if (!content) {
            return errorResponse(res, 400, 'Missing required field: content', 'INVALID_INPUT');
        }

        // Validate ticket ID
        if (!validateTicketId(ticketId)) {
            return errorResponse(res, 400, 'Invalid ticket ID format', 'INVALID_INPUT');
        }

        // Validate index
        const commentIndex = parseInt(index);
        if (isNaN(commentIndex) || commentIndex < 0) {
            return errorResponse(res, 400, 'Invalid comment index', 'INVALID_INPUT');
        }

        // Get Firebase Admin reference
        const admin = req.app.get('admin');
        const db = admin.database();

        // Check if ticket exists and get current data
        const ticketRef = db.ref(`feedback/tickets/${ticketId}`);
        const snapshot = await ticketRef.once('value');

        if (!snapshot.exists()) {
            return errorResponse(res, 404, 'Ticket not found', 'TICKET_NOT_FOUND');
        }

        const currentData = snapshot.val();
        const currentComments = currentData.comments || [];

        // Check if comment index exists
        if (commentIndex >= currentComments.length) {
            return errorResponse(res, 404, 'Comment not found', 'COMMENT_NOT_FOUND');
        }

        // Update comment
        const updatedComments = [...currentComments];
        updatedComments[commentIndex] = {
            ...updatedComments[commentIndex],
            content: sanitizeString(content, 5000),
            editedAt: new Date().toISOString()
        };

        // Update ticket
        await ticketRef.set({
            ...currentData,
            comments: updatedComments,
            updatedAt: new Date().toISOString()
        });

        console.log(`Comment ${commentIndex} edited successfully in ticket: ${ticketId}`);

        res.json({
            success: true,
            comment: updatedComments[commentIndex]
        });

    } catch (error) {
        console.error('Error editing comment:', error);
        return errorResponse(res, 500, 'Failed to edit comment', 'SERVER_ERROR');
    }
});

// DELETE /api/feedback/tickets/:ticketId/comments/:index - Delete comment
router.delete('/tickets/:ticketId/comments/:index', async (req, res) => {
    const { ticketId, index } = req.params;
    console.log(`DELETE /api/feedback/tickets/${ticketId}/comments/${index} - Deleting comment`);

    try {
        // Validate ticket ID
        if (!validateTicketId(ticketId)) {
            return errorResponse(res, 400, 'Invalid ticket ID format', 'INVALID_INPUT');
        }

        // Validate index
        const commentIndex = parseInt(index);
        if (isNaN(commentIndex) || commentIndex < 0) {
            return errorResponse(res, 400, 'Invalid comment index', 'INVALID_INPUT');
        }

        // Get Firebase Admin reference
        const admin = req.app.get('admin');
        const db = admin.database();

        // Check if ticket exists and get current data
        const ticketRef = db.ref(`feedback/tickets/${ticketId}`);
        const snapshot = await ticketRef.once('value');

        if (!snapshot.exists()) {
            return errorResponse(res, 404, 'Ticket not found', 'TICKET_NOT_FOUND');
        }

        const currentData = snapshot.val();
        const currentComments = currentData.comments || [];

        // Check if comment index exists
        if (commentIndex >= currentComments.length) {
            return errorResponse(res, 404, 'Comment not found', 'COMMENT_NOT_FOUND');
        }

        // Remove comment
        const updatedComments = currentComments.filter((_, i) => i !== commentIndex);

        // Update ticket
        await ticketRef.set({
            ...currentData,
            comments: updatedComments,
            updatedAt: new Date().toISOString()
        });

        console.log(`Comment ${commentIndex} deleted successfully from ticket: ${ticketId}`);

        res.json({
            success: true,
            message: 'Comment deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting comment:', error);
        return errorResponse(res, 500, 'Failed to delete comment', 'SERVER_ERROR');
    }
});

module.exports = router;
