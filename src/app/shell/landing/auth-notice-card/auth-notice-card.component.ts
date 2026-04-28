import { Component, input, output } from '@angular/core';
import {
  TngCardActionsComponent,
  TngCardComponent,
  TngCardContentComponent,
  TngCardDescriptionComponent,
  TngCardFooterComponent,
  TngCardHeaderComponent,
  TngCardTitleComponent,
  TngProgressBarComponent,
} from '@tailng-ui/components';

export type AuthNoticeAction = 'logout' | 'retry';

export type AuthNotice = Readonly<{
  action: AuthNoticeAction;
  buttonLabel: string;
  context: string;
  message: string;
  showProgress: boolean;
  title: string;
  tone: 'danger' | 'info' | 'success' | 'warning';
}>;

@Component({
  selector: 'app-auth-notice-card',
  imports: [
    TngCardActionsComponent,
    TngCardComponent,
    TngCardContentComponent,
    TngCardDescriptionComponent,
    TngCardFooterComponent,
    TngCardHeaderComponent,
    TngCardTitleComponent,
    TngProgressBarComponent,
  ],
  templateUrl: './auth-notice-card.component.html',
  styleUrl: './auth-notice-card.component.css',
})
export class AuthNoticeCardComponent {
  readonly notice = input<AuthNotice | null>(null);
  readonly noticeAction = output<AuthNoticeAction>();
}

