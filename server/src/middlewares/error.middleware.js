export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message:
      statusCode === 500
        ? "Internal Server Error"
        : err.message,
    errors: err.errors || [],
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
    }),
  });
};