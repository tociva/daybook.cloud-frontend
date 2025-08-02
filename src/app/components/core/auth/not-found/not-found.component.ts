import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LogoBlockComponent } from '../../../shared/logo-block/logo-block.component';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, LogoBlockComponent],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.css'
})
export class NotFoundComponent {

}
