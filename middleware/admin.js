const ErrorResponse = require('../utils/errorResponse');

// Check if user is admin
exports.adminOnly = (req, res, next) => {
  if (!req.user) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  if (req.user.role !== 'admin') {
    return next(
      new ErrorResponse(
        `User role '${req.user.role}' is not authorized to access this route`,
        403
      )
    );
  }

  next();
};