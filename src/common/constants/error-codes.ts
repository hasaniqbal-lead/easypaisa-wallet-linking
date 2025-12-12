export const EASYPAISA_ERROR_CODES = {
  '0000': {
    message: 'Success',
    httpStatus: 200,
    retryable: false,
  },
  '0001': {
    message: 'System error',
    httpStatus: 500,
    retryable: true,
  },
  '0002': {
    message: 'Required field missing',
    httpStatus: 400,
    retryable: false,
  },
  '0003': {
    message: 'Invalid order ID',
    httpStatus: 400,
    retryable: false,
  },
  '0004': {
    message: 'Invalid merchant account number',
    httpStatus: 400,
    retryable: false,
  },
  '0005': {
    message: 'Merchant account not active',
    httpStatus: 403,
    retryable: false,
  },
  '0006': {
    message: 'Invalid store ID',
    httpStatus: 400,
    retryable: false,
  },
  '0007': {
    message: 'Store not active',
    httpStatus: 403,
    retryable: false,
  },
  '0008': {
    message: 'Payment method not enabled',
    httpStatus: 400,
    retryable: false,
  },
  '0009': {
    message: 'CC transaction failed',
    httpStatus: 402,
    retryable: false,
  },
  '0010': {
    message: 'Invalid credentials',
    httpStatus: 401,
    retryable: false,
  },
  '0011': {
    message: 'Wrong PIN entered',
    httpStatus: 401,
    retryable: false,
  },
  '0012': {
    message: 'PIN not entered',
    httpStatus: 400,
    retryable: false,
  },
  '0013': {
    message: 'Low balance',
    httpStatus: 402,
    retryable: false,
  },
  '0014': {
    message: 'Account does not exist',
    httpStatus: 404,
    retryable: false,
  },
  '0015': {
    message: 'Invalid token expiry',
    httpStatus: 400,
    retryable: false,
  },
  '0016': {
    message: 'Token expired before current',
    httpStatus: 400,
    retryable: false,
  },
  '0017': {
    message: 'Settlement not configured',
    httpStatus: 500,
    retryable: false,
  },
  '0018': {
    message: 'Token already exists',
    httpStatus: 409,
    retryable: false,
  },
  '0019': {
    message: 'Token does not exist',
    httpStatus: 404,
    retryable: false,
  },
  '0020': {
    message: 'Pinless not enabled',
    httpStatus: 403,
    retryable: false,
  },
  '0021': {
    message: 'Invalid payment method',
    httpStatus: 400,
    retryable: false,
  },
  '0022': {
    message: 'JSON invalid',
    httpStatus: 400,
    retryable: false,
  },
  '0023': {
    message: 'Signature error',
    httpStatus: 401,
    retryable: false,
  },
  '0024': {
    message: 'Signature invalid',
    httpStatus: 401,
    retryable: false,
  },
  '0025': {
    message: 'Key not uploaded',
    httpStatus: 500,
    retryable: false,
  },
  '0026': {
    message: 'Invalid mobile number',
    httpStatus: 400,
    retryable: false,
  },
  '0027': {
    message: 'Invalid email address',
    httpStatus: 400,
    retryable: false,
  },
  '0028': {
    message: 'Invalid transaction amount',
    httpStatus: 400,
    retryable: false,
  },
  '0029': {
    message: 'Transaction amount beyond limits',
    httpStatus: 400,
    retryable: false,
  },
  '0030': {
    message: 'Invalid OTP',
    httpStatus: 400,
    retryable: false,
  },
  '0031': {
    message: 'OTP creation failed',
    httpStatus: 500,
    retryable: true,
  },
  '0032': {
    message: 'Internal ID does not exist',
    httpStatus: 404,
    retryable: false,
  },
  '0033': {
    message: 'Internal ID incorrect',
    httpStatus: 400,
    retryable: false,
  },
  '0034': {
    message: 'OTP expired',
    httpStatus: 400,
    retryable: false,
  },
  '0035': {
    message: 'Link already inactive',
    httpStatus: 400,
    retryable: false,
  },
} as const;

export type EasypaisaErrorCode = keyof typeof EASYPAISA_ERROR_CODES;

export function isRetryableError(code: string): boolean {
  return EASYPAISA_ERROR_CODES[code]?.retryable || false;
}

export function getErrorMessage(code: string): string {
  return EASYPAISA_ERROR_CODES[code]?.message || 'Unknown error';
}

export function getErrorHttpStatus(code: string): number {
  return EASYPAISA_ERROR_CODES[code]?.httpStatus || 500;
}
