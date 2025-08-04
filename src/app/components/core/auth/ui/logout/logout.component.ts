import { Component } from '@angular/core';
import { LogoBlockComponent } from '../../../../shared/logo-block/logo-block.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-logout',
  imports: [RouterLink, LogoBlockComponent],
  templateUrl: './logout.component.html',
  styleUrl: './logout.component.css'
})
export class LogoutComponent {

}
