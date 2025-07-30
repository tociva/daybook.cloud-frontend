import { Subscription } from '../../../../features/subscription/subscription/store/subscription.models';
import { Organization } from '../../../../features/organization/organization/store/organization.models';
import { Branch } from '../../../../features/organization/branch/store/branch.models';
import { FiscalYear } from '../../../../features/organization/fiscal-year/store/fiscal-year.models';

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
