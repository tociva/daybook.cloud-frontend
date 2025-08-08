export interface HttpState {
  loading: Record<string, boolean>;
  errors: Record<string, any>;
}

export interface HttpLoadingState {
  [requestId: string]: boolean;
}

export interface HttpErrorState {
  [requestId: string]: any;
}