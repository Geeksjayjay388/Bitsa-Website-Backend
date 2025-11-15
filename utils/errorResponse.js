/**
 * Custom Error Response Class
 * Extends the built-in Error class to include HTTP status codes
 * Used throughout the application for consistent error handling
 */

class ErrorResponse extends Error {
  /**
   * @param {string} message - Error message to be displayed
   * @param {number} statusCode - HTTP status code (400, 401, 404, 500, etc.)
   */
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Flag to identify operational errors vs programming errors

    // Capture stack trace for debugging
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ErrorResponse;