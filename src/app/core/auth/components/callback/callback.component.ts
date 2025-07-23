import { Component } from '@angular/core';
import { AuthFacade } from '../../service/auth-facade.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-callback',
  imports: [CommonModule],
  templateUrl: './callback.component.html',
  styleUrl: './callback.component.scss'
})
export class CallbackComponent {
  constructor(public authFacade: AuthFacade) {}

  ngOnInit(): void {
    this.authFacade.handleCallback();
  }

  retry(): void {
    this.authFacade.login();
  }
}
