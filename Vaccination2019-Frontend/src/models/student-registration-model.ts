export class StudentRequest {
    duoId: string;
    password: string;
}

export class StudentResponse {
    study: string;
    crebo: boolean;
    school: School;
}

export class Address {
  address: string;
  zipCode: string;
  country: string;
}

export class School extends Address {
    name: string;
}