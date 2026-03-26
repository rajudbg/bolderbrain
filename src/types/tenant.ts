/**
 * Avoid importing Prisma enums here so Edge middleware can load tenant types
 * without pulling generated Prisma client code.
 */
export type TenantClaim = {
  organizationId: string;
  slug: string;
  role: "SUPER_ADMIN" | "ADMIN" | "EMPLOYEE";
};
