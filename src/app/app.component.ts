import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthFacade } from './core/auth/service/auth-facade.service';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [CommonModule, RouterOutlet]
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'app';
  
  private destroy$ = new Subject<void>();

  constructor(public authFacade: AuthFacade) {}

  ngOnInit(): void {
    this.authFacade.checkSession();
    
    this.authFacade.isAuthenticated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isAuth => {
        if (isAuth) {
          console.log('User authenticated successfully');
        }
      });

    this.authFacade.tokenExpiring$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isExpiring => {
        if (isExpiring) {
          console.warn('Token is about to expire');
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Logout the current user
   */
  logout(): void {
    this.authFacade.logout();
  }

  /**
   * Refresh the authentication token
   */
  refreshToken(): void {
    this.authFacade.refreshToken();
  }

  /**
   * Clear any authentication errors
   */
  clearError(): void {
    // Assuming there's a clear error action in your store
    // You may need to add this action to your AuthActions if it doesn't exist
    console.log('Clear error called');
    // this.authFacade.clearError(); - Add this method to your facade if needed
  }
}