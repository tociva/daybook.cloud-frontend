import type { Branch } from '../branch/branch.model';
import type { FiscalYear } from '../fiscal-year/fiscal-year.model';
import type { Organization } from '../organization/organization.model';
import type { Subscription } from '../subscription/subscription.model';

export interface UserSession {
  id?: string;
  displayname?: string;
  displayName?: string;
  username?: string;
  name: string;
  email: string;
  userid: string;
  updatedat?: string;
  subscription?: Subscription | null;
  organization?: Organization | null;
  branch?: Branch | null;
  fiscalyear?: FiscalYear | null;
  ownorgs?: Organization[] | null;
}

export interface UserSessionStateModel {
  error: string | null;
  isLoading: boolean;
  session: UserSession | null;
}
