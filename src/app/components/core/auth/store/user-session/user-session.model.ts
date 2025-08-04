import { Branch } from "../../../../features/management/store/branch/branch.model";
import { FiscalYear } from "../../../../features/management/store/fiscal-year/fiscal-year.model";
import { Organization } from "../../../../features/management/store/organization/organization.model";
import { Subscription } from "../../../../features/management/store/subscription/subscription.model";

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
