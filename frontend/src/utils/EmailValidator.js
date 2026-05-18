export const isValidStacklyEmail = (email, firstName, lastName) => {
  if (!email || !firstName || !lastName) return false;

  const emailLower = email.toLowerCase();

  // 1. Must contain exactly one "@"
  const parts = emailLower.split("@");
  if (parts.length !== 2) return false;

  const [localPart, domain] = parts;

  // 2. Block "@thestackly.com"
  if (!localPart) return false;

  // 3. Domain check
  if (domain !== "thestackly.com") return false;

  // 4. Local part length
  if (localPart.length < 3 || localPart.length > 30) return false;

  // 5. Must start with a letter
  if (!/^[a-z]/.test(localPart)) return false;

  // 6. Allowed characters
  if (!/^[a-z0-9._]+$/.test(localPart)) return false;

  // 7. Max 4 digits
  const digitCount = (localPart.match(/\d/g) || []).length;
  if (digitCount > 4) return false;

  // 8. Prevent consonant spam
  if (/[bcdfghjklmnpqrstvwxyz]{6,}/.test(localPart)) return false;

  // ───────── Name-based validation ─────────
  const f = firstName.toLowerCase();
  const l = lastName.toLowerCase();

  const validNamePatterns = [
    f,
    l,
    `${f}.${l}`,
    `${f}${l}`,
    `${l}.${f}`,
    `${l}${f}`,
  ];

  if (!validNamePatterns.some(p => localPart.includes(p))) {
    return false;
  }

  return true;
};
