import { CommonModule } from '@angular/common';
import { Component, effect, inject, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatDrawerMode, MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { isMobile } from '../util/daybook.util';
import * as AuthActions from './core/auth/store/auth/auth.actions';
import { selectIsAuthenticated, selectIsInitialized, selectUser } from './core/auth/store/auth/auth.selectors';
import * as UserSessionActions from './core/auth/store/user-session/user-session.actions';
import { selectConfigLoaded } from './core/config/store/config.selectors';
import { SideBarContent } from './features/layout/side-bar-content/side-bar-content';
import { UserProfile } from './util/user-profile.type';

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
