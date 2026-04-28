import { PermissionsModel } from './permissions.model';

export interface PermissionsState {
  permissions: PermissionsModel;
}

export const initialPermissionsState: PermissionsState = {
  permissions: {
    values: [],
  },
};

