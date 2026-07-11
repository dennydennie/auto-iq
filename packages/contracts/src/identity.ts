import type { UserRole, UserStatus, ConsentType } from "./enums.js";

// ─── Shared primitives ────────────────────────────────────────────────────────

export interface TimestampFields {
  createdAt: string; // ISO 8601
  updatedAt: string;
}

// ─── Register ─────────────────────────────────────────────────────────────────

export interface RegisterRequest {
  fullName: string;
  /** Primary identifier — must be unique */
  email: string;
  /** E.164 format, e.g. +2637712345678 */
  phone: string;
  /** Plaintext — hashed server-side */
  password: string;
  role: Extract<UserRole, "BUYER" | "SELLER">;
  city: string;
}

export interface RegisterResponse {
  userId: string;
  email: string;
  phone: string;
  role: UserRole;
  /** True when phone OTP is required before full access */
  otpRequired: boolean;
}

// ─── CSRF ────────────────────────────────────────────────────────────────────

export interface CsrfResponse {
  token: string;
  headerName: "X-CSRF-Token";
}

// ─── Login ────────────────────────────────────────────────────────────────────

export interface LoginRequest {
  /** Email or phone */
  identifier: string;
  password: string;
}

export interface LoginResponse {
  userId: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  /** Present if auth uses JWT; absent when HttpOnly cookies are used */
  accessToken?: string;
  /** Present if auth uses JWT; absent when HttpOnly cookies are used */
  refreshToken?: string;
}

// ─── OTP ──────────────────────────────────────────────────────────────────────

export interface SendOtpRequest {
  /** Email or E.164 phone number tied to the account */
  identifier?: string;
  /** E.164 phone number. Retained for backward-compatible clients. */
  phone?: string;
}

export interface SendOtpResponse {
  /** Seconds until OTP expires */
  expiresIn: number;
  /** Remaining sends before rate-limit lockout */
  attemptsRemaining: number;
}

export interface VerifyOtpRequest {
  /** Email or E.164 phone number tied to the account */
  identifier?: string;
  /** E.164 phone number. Retained for backward-compatible clients. */
  phone?: string;
  code: string;
}

export interface VerifyOtpResponse {
  verified: boolean;
}

// ─── Password ─────────────────────────────────────────────────────────────────

export interface ForgotPasswordRequest {
  email: string;
  client?: "WEB" | "MOBILE";
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

// ─── /me ──────────────────────────────────────────────────────────────────────

export interface BuyerProfileDto {
  id: string;
  city: string;
  preferredBodyTypes: string[];
  preferredMakes: string[];
  budgetMin: number | null;
  budgetMax: number | null;
}

export interface SellerProfileDto {
  id: string;
  businessName: string | null;
  city: string;
  /** All required consents accepted */
  consentsComplete: boolean;
  verified: boolean;
}

export interface MeResponse extends TimestampFields {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  status: UserStatus;
  roles: UserRole[];
  phoneVerified: boolean;
  emailVerified: boolean;
  buyerProfile: BuyerProfileDto | null;
  sellerProfile: SellerProfileDto | null;
}

export interface UpdateMeRequest {
  fullName?: string;
  city?: string;
  /** Buyer preferences */
  preferredBodyTypes?: string[];
  preferredMakes?: string[];
  budgetMin?: number;
  budgetMax?: number;
  /** Seller info */
  businessName?: string;
}

// ─── Consents ─────────────────────────────────────────────────────────────────

export interface RecordConsentRequest {
  consentType: ConsentType;
  /** Semver consent document version, e.g. "1.0.0" */
  version: string;
  accepted: true;
}

export interface ConsentRecord extends TimestampFields {
  id: string;
  consentType: ConsentType;
  version: string;
  acceptedAt: string;
}

export interface ConsentsResponse {
  consents: ConsentRecord[];
  /** True when all role-required consents have been accepted */
  complete: boolean;
}
