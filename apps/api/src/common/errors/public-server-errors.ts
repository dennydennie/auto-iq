export const DELIVERY_MESSAGES = Object.freeze({
  verification: "Unable to deliver a verification code right now. Please try again shortly.",
  passwordReset: "Password reset is temporarily unavailable. Please try again shortly.",
});

export const PUBLIC_SERVER_ERRORS = Object.freeze({
  DELIVERY_UNAVAILABLE: Object.freeze({
    code: "DELIVERY_UNAVAILABLE",
    message: "We couldn't send your code right now. Please try again shortly.",
  }),
  PRESIGN_FAILED: Object.freeze({
    code: "PRESIGN_FAILED",
    message:
      "We couldn't prepare your upload right now. Please try again shortly.",
  }),
  STORAGE_INSPECTION_FAILED: Object.freeze({
    code: "STORAGE_INSPECTION_FAILED",
    message:
      "We couldn't verify your uploaded file right now. Please try again shortly.",
  }),
});

export type PublicServerErrorCode = keyof typeof PUBLIC_SERVER_ERRORS;

export function getPublicServerError(code: string, message?: string) {
  if (!isPublicServerErrorCode(code)) return undefined;
  const error = PUBLIC_SERVER_ERRORS[code];
  if (code === "DELIVERY_UNAVAILABLE" && Object.values(DELIVERY_MESSAGES).some(value => value === message)) {
    return { ...error, message: message! };
  }
  return error;
}

function isPublicServerErrorCode(code: string): code is PublicServerErrorCode {
  return Object.hasOwn(PUBLIC_SERVER_ERRORS, code);
}
