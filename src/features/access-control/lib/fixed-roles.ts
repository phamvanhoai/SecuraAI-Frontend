export const FIXED_ROLE_CODES = [
  "ADMIN",
  "SECURITY_OFFICER",
  "EMPLOYEE",
  "EXECUTIVE",
] as const;

const fixedRoleCodeSet = new Set<string>(FIXED_ROLE_CODES);

export function isFixedRoleCode(roleCode: string): boolean {
  return fixedRoleCodeSet.has(roleCode);
}
