import { Component } from '@angular/core';
import { AuthFacade } from '../../service/auth-facade.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-silent-callback',
  imports: [CommonModule],
  templateUrl: './silent-callback.component.html',
  styleUrl: './silent-callback.component.scss'
})
export class SilentCallbackComponent {
  constructor(private authFacade: AuthFacade) {}

  ngOnInit(): void {
    this.authFacade.handleSilentCallback();
  }
}
