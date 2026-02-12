export const STATUS_CODES = {
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  SERVER_ERROR: 500,
};

export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Not authorized to access this route',
  TOKEN_EXPIRED: 'Token expired, please login again',
  INVALID_TOKEN: 'Invalid token',
  USER_NOT_FOUND: 'User not found',
  INVALID_CREDENTIALS: 'Invalid credentials',
  EMAIL_EXISTS: 'Email already registered',
  USERNAME_EXISTS: 'Username already taken',
  SERVER_ERROR: 'Server error',
  VALIDATION_ERROR: 'Validation error',
};