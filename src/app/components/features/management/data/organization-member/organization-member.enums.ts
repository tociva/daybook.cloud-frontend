export enum UserRoles {
  SUPER_ADMIN = 'super-admin',
  OWNER = 'owner',
  ADMIN = 'admin',
  USER = 'user',
}

export enum OrganizationMemberStatus {
  INVITED = 0,
  ACCEPTED = 1,
  REJECTED = 2,
  REMOVED = 3,
  INVITE_EXPIRED = 4,
  MEMBER_EXITED = 5,
}
