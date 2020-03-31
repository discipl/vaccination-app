export class LoginRequest {
    password: string;

  constructor(values) {
    this.password = values.password;
  }
}

export class MinistryLogin extends LoginRequest {
  login: string = 'ministry';

  constructor(values) {
    super(values);
  }
}

export class HcpManagerLogin extends LoginRequest {
  HCPManagerNumber: string;

  constructor(values) {
    super(values);
    this.HCPManagerNumber = values.HCPManagerNumber;
  }
}
