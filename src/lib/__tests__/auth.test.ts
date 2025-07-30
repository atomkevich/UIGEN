import { test, expect, vi, beforeEach, afterEach } from "vitest";
import { createSession } from "../auth";
import { SignJWT } from "jose";
import { cookies } from "next/headers";

// Mock the server-only import
vi.mock("server-only", () => ({}));

// Mock jose JWT functions
vi.mock("jose", () => ({
  SignJWT: vi.fn().mockImplementation(() => ({
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    sign: vi.fn(),
  })),
  jwtVerify: vi.fn(),
}));

// Mock Next.js cookies
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    set: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  // Set environment variables for testing
  vi.stubEnv('NODE_ENV', 'test');
  vi.stubEnv('JWT_SECRET', 'test-secret-key');
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

test("createSession creates JWT token and sets cookie", async () => {
  const mockToken = "mock-jwt-token";
  const userId = "user123";
  const email = "test@example.com";
  
  // Get the mocked functions
  vi.mocked(SignJWT).mockImplementation(() => ({
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    sign: vi.fn().mockResolvedValue(mockToken),
  } as any));
  
  const mockCookies = vi.mocked(cookies);
  const mockCookieSet = vi.fn();
  mockCookies.mockResolvedValue({
    set: mockCookieSet,
    get: vi.fn(),
    delete: vi.fn(),
  } as any);

  await createSession(userId, email);

  // Verify JWT constructor was called
  expect(SignJWT).toHaveBeenCalledWith({
    userId,
    email,
    expiresAt: expect.any(Date),
  });
  
  // Verify cookie was set with correct options
  expect(mockCookieSet).toHaveBeenCalledWith("auth-token", mockToken, {
    httpOnly: true,
    secure: false, // NODE_ENV is "test", not "production"
    sameSite: "lax",
    expires: expect.any(Date),
    path: "/",
  });

  // Verify the expiration date is approximately 7 days from now
  const [, , cookieOptions] = mockCookieSet.mock.calls[0];
  const expiresAt = cookieOptions.expires;
  const expectedExpiration = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const timeDiff = Math.abs(expiresAt.getTime() - expectedExpiration.getTime());
  expect(timeDiff).toBeLessThan(1000); // Within 1 second tolerance
});

test("createSession sets secure cookie in production", async () => {
  const mockToken = "mock-jwt-token";
  const userId = "user123";
  const email = "test@example.com";
  
  vi.stubEnv('NODE_ENV', 'production');
  
  // Setup mocks
  vi.mocked(SignJWT).mockImplementation(() => ({
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    sign: vi.fn().mockResolvedValue(mockToken),
  } as any));
  
  const mockCookieSet = vi.fn();
  vi.mocked(cookies).mockResolvedValue({
    set: mockCookieSet,
    get: vi.fn(),
    delete: vi.fn(),
  } as any);

  await createSession(userId, email);

  expect(mockCookieSet).toHaveBeenCalledWith("auth-token", mockToken, {
    httpOnly: true,
    secure: true, // Should be true in production
    sameSite: "lax",
    expires: expect.any(Date),
    path: "/",
  });
});

test("createSession uses default JWT secret when not provided", async () => {
  vi.stubEnv('JWT_SECRET', '');
  const mockToken = "mock-jwt-token";
  
  // Setup mocks
  vi.mocked(SignJWT).mockImplementation(() => ({
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    setIssuedAt: vi.fn().mockReturnThis(),
    sign: vi.fn().mockResolvedValue(mockToken),
  } as any));
  
  const mockCookieSet = vi.fn();
  vi.mocked(cookies).mockResolvedValue({
    set: mockCookieSet,
    get: vi.fn(),
    delete: vi.fn(),
  } as any);

  await createSession("user123", "test@example.com");

  // The function should still work with default secret
  expect(SignJWT).toHaveBeenCalledOnce();
  expect(mockCookieSet).toHaveBeenCalledOnce();
});