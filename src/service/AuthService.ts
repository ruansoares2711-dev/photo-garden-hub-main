import { AuthRepository } from "@/repository/AuthRepository";

export const AuthService = {
  signIn: AuthRepository.signIn,
  signOut: AuthRepository.signOut,
  signUp(email: string, password: string, displayName: string | undefined, redirectTo: string) {
    const name = displayName?.trim() || email.split("@")[0];
    return AuthRepository.signUp(email, password, name, redirectTo);
  },
  getSession: AuthRepository.getSession,
  onAuthStateChange: AuthRepository.onAuthStateChange,
  isAdmin: AuthRepository.isAdmin,
};
