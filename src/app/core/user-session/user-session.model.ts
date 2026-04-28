export type UserSessionSelectionId = number | string;

export interface UserSessionOrganization {
  id?: UserSessionSelectionId;
  organizationid?: UserSessionSelectionId;
  name?: string;
  [key: string]: unknown;
}

export interface UserSession {
  ownorgs?: UserSessionOrganization[] | null;
  [key: string]: unknown;
}

export interface UserSessionStateModel {
  error: string | null;
  isLoading: boolean;
  session: UserSession | null;
}
