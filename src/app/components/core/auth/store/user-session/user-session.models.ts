import { Subscription } from '../../../../features/subscription/subscription/store/subscription.models';
import { Organization } from '../../../../features/management/organization/store/organization.models';
import { Branch } from '../../../../features/management/branch/store/branch.models';
import { FiscalYear } from '../../../../features/management/fiscal-year/store/fiscal-year.models';

export interface UserSession {
  id?: string;
  name: string;
  email: string;
  userid: string;
  updatedat?: string;
  subscription?: Subscription | null;
  organization?: Organization | null;
  branch?: Branch | null;
  fiscalyear?: FiscalYear | null;
  ownorgs?: Organization[];
}
