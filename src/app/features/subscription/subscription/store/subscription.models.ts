export interface Subscription {
  id?: string;
  name: string;
  description?: string;
  externalplanid?: string;
  status?: 'active' | 'canceled' | 'pending' | 'expired' | 'pastdue';
  startdate: Date;
  enddate: Date;
  createdat?: Date;
  updatedat?: Date;
  props?: any;
  subscriptionplanid: string;
  userid: string;
}
