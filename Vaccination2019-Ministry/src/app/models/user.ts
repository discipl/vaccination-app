import { PaginationResponse } from './paginationResponse';

export enum Role {
  MINISTRY = 'MINISTRY',
  HCP_MANAGER = 'HCP_MANAGER',
}

export class User {
  _id: String;
  role: Role;
}

class Person extends User {
  firstName: String;
  lastName: String;
}

export class Student extends Person {
  duoId: String;
}

export class HealthcareProvider extends Person {
  bigId: String;
}

export class HcpManager extends User {
  HCPManagerNumber: String;
}

export class HcpManagersResponse extends PaginationResponse<HcpManager> {
}
