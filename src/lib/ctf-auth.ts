const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[a-z0-9_-]{3,24}$/;
export const CTF_PASSWORD_REQUIREMENT =
  "Use at least 8 characters with at least one letter and one number.";

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string) {
  const email = normalizeEmail(value);
  return email.length <= 254 && EMAIL_PATTERN.test(email);
}

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function isValidUsername(value: string) {
  return USERNAME_PATTERN.test(normalizeUsername(value));
}

export function isValidCtfPassword(value: string) {
  return (
    value.length >= 8 &&
    /[A-Za-z]/.test(value) &&
    /[0-9]/.test(value)
  );
}

export function safeAuthRedirect(value: FormDataEntryValue | string | null) {
  const path = typeof value === "string" ? value : "";
  let decoded = path;
  try {
    decoded = decodeURIComponent(path);
  } catch {
    return "/weekly-ctfs";
  }
  if (
    !decoded.startsWith("/weekly-ctfs") ||
    decoded.startsWith("//") ||
    decoded.includes("\\")
  ) {
    return "/weekly-ctfs";
  }
  return path;
}

export function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}
