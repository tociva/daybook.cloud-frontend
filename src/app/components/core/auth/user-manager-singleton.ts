import { UserManager } from 'oidc-client-ts';

let userManager: UserManager | undefined = undefined;

export function setUserManager(manager: UserManager) {
  userManager = manager;
}

export function getUserManager(): UserManager {
  if (!userManager) throw new Error('UserManager not initialized!');
  return userManager;
}

export function isUserManagerInitialized(): boolean {
  return !!userManager;
}
