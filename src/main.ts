import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { Store } from '@ngrx/store';
import * as ConfigActions from './app/components/core/auth/store/config/config.actions';

bootstrapApplication(AppComponent, appConfig)
  .then((ref) => {
    const store = ref.injector.get(Store);
    store.dispatch(ConfigActions.loadConfig());
  })
  .catch((err) => console.error(err));
