
import { Component, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthStore } from '../../core/auth/store/auth/auth.store';
import { LeftDrawerComponent } from '../left-drawer/left-drawer.component';
import { ViewStore } from '../store/view/view.store';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, LeftDrawerComponent, HeaderComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent {
}
