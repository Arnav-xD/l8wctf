const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_PATTERN = /^[a-z0-9_-]{3,24}$/;

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
