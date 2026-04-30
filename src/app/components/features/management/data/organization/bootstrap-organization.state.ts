export type BootstrapOrganizationState = Readonly<{
  error: string | null;
  isLoading: boolean;
}>;

export const initialBootstrapOrganizationState: BootstrapOrganizationState = {
  error: null,
  isLoading: false,
};
