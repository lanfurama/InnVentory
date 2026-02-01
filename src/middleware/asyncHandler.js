/**
 * Wraps async route handlers so rejected promises are passed to next(err).
 * Prevents unhandled rejections from crashing the server.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
