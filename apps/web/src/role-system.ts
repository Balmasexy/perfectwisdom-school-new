export type UserRole = "admin" | "staff" | "parent";

const ROLE_KEY = "perfect-wisdom-school-role";

export const DEFAULT_ROLE: UserRole = "admin";

export function getSavedRole(): UserRole {
  if (typeof window === "undefined") return DEFAULT_ROLE;

  const saved = localStorage.getItem(ROLE_KEY);

  if (
    saved === "admin" ||
    saved === "staff" ||
    saved === "parent"
  ) {
    return saved;
  }

  return DEFAULT_ROLE;
}

export function saveRole(role: UserRole) {
  if (typeof window !== "undefined") {
    localStorage.setItem(ROLE_KEY, role);
  }
}

export function clearRole() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(ROLE_KEY);
  }
}

export function roleName(role: UserRole) {
  switch (role) {
    case "admin":
      return "Admin";
    case "staff":
      return "Staff";
    case "parent":
      return "Parent";
  }
}

export function dashboardForRole(role: UserRole) {
  switch (role) {
    case "admin":
      return "admin";
    case "staff":
      return "staff";
    case "parent":
      return "parent";
  }
}
