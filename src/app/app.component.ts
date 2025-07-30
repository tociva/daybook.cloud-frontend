import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import * as AuthActions from './core/auth/store/auth/auth.actions';
import { selectIsAuthenticated, selectIsInitialized, selectUser } from './core/auth/store/auth/auth.selectors';
import { selectConfigLoaded } from './core/config/store/config.selectors';
import { UserProfile } from './util/user-profile.type';
import { MatMenuModule } from '@angular/material/menu';
import { SideBarContent } from './features/layout/side-bar-content/side-bar-content';
import { isMobile } from '../util/daybook.util';
import { MatDrawerMode } from '@angular/material/sidenav';
import * as UserSessionActions from './core/auth/store/user-session/user-session.actions';
import { selectUserSession } from './core/auth/store/user-session/user-session.selectors';
import { Subject, takeUntil, tap } from 'rxjs';
import { selectOrganizations } from './features/organization/organization/store/organization.selectors';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [CommonModule,
    RouterOutlet,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatListModule,
    MatButtonModule,
    MatMenuModule,
    SideBarContent
  ]
})
export class AppComponent {

  private store = inject(Store);
  private configLoaded = this.store.selectSignal(selectConfigLoaded);
  private readonly hydraUser = this.store.selectSignal(selectUser);
  readonly isInitialized = this.store.selectSignal(selectIsInitialized);
  readonly isAuthenticated = this.store.selectSignal(selectIsAuthenticated);
  private router = inject(Router);
  private userSession = this.store.selectSignal(selectUserSession);

  user!: UserProfile;
  
  isOpen = true;

  isMobile = isMobile();

  drawerMode:MatDrawerMode = 'side';

  private destroy$ = new Subject<void>();

  @ViewChild('drawerBig') drawerBig!: MatSidenav;

  ngOnInit(): void {
    if(this.isMobile){
      this.isOpen = false;
      this.drawerMode = 'over';
    }
  }

  readonly triggerAuthInit = effect(() => {
    if (this.configLoaded()) {
      this.store.dispatch(AuthActions.initializeAuth());
    }
  });

  readonly logUserEffect = effect(() => {
    const userValue = this.hydraUser();
    if (userValue) {
      this.user = userValue.profile['user'] as UserProfile;
      this.store.dispatch(UserSessionActions.createUserSession());
    }
  });

  readonly watchUserSessionEffect = effect(() => {
    const session = this.userSession();
    if (session && session.ownorgs?.length) {
      console.log('Organization count:', session.ownorgs.length);
  
      if (session.ownorgs.length === 1) {
        // Automatically select if only one org
        this.store.select(selectOrganizations).pipe(
          takeUntil(this.destroy$),
          tap((organizations) => {
            console.log('Organizations:', organizations);
          })
        );
      }
    }
  });
  

  goToSettings(): void {
    this.router.navigate(['/settings']);
  }
  
  logout(): void {
    this.store.dispatch(AuthActions.logoutKratos());
  }

  toggleSidebar() {
    this.isOpen = !this.isOpen;
  }

  openSidebar() {
    this.isOpen = true;
    this.drawerBig?.open();
  }

  closeSidebar() {
    this.drawerBig?.close();
  }
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
