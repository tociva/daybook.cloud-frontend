
import { createActionGroup, props, emptyProps } from '@ngrx/store';
import { User } from 'oidc-client-ts';

export const authActions = createActionGroup({
  source: 'Auth',
  events: {
    // Called when the app initializes or OIDC config is loaded
    initialize: emptyProps(),
    
    // User begins login process
    login: props<{ returnUri?: string }>(),
    
    // User login successful
    loginSuccess: props<{ user: User }>(),
    
    // User login failed
    loginFailure: props<{ error: string }>(),
    
    // User logged out
    logoutHydra: emptyProps(),
    
    logoutKratos: emptyProps(),
    
    // User logout completed
    logoutSuccess: emptyProps(),
    
    // User logout failed
    logoutFailure: props<{ error: string }>(),
    
    // Set authenticated flag
    setIsAuthenticated: props<{ isAuthenticated: boolean }>(),
    
    // Set loading state
    setIsLoading: props<{ isLoading: boolean }>(),
    
    // Set initialized state
    setIsInitialized: props<{ isInitialized: boolean }>(),
    
    // Set user
    setUser: props<{ user: User | null }>(),
    
    // Set hydrated state
    setIsHydrated: props<{ isHydrated: boolean }>(),
    
    // Set error
    setError: props<{ error: string | null }>(),
    
    // Update last activity timestamp
    setLastActivity: props<{ lastActivity: number }>(),
    
    // For when OIDC callback handling begins
    handleCallback: emptyProps(),
    
    handleLogoutCallback: emptyProps(),
    
    handleSilentCallback: emptyProps(),
    
    // Silent login
    silentRenew: emptyProps(),
    
    // Silent login success
    silentRenewSuccess: props<{ user: User }>(),
    
    // Silent login failure
    silentRenewFailure: props<{ error: string }>(),
    
    performRedirect: props<{ returnUri: string }>()
  }
});
  