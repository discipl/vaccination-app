import { StudentResponse, Address } from './student-registration-model';
import { HealthcareProviderResponse } from './hcProvider-registration-model';
import { VaccineType } from "./vaccines.model";

export enum Role {
    HealthcareProvider = 'HEALTHCARE_PROVIDER',
    Student = 'STUDENT'
}

export class User {
    _id: string;
    firstName: string;
    lastName: string;
    login: string;
    role: Role;
    dateOfBirth: string;
    address: Address;
    duoId: string;
    bigId: string;
    student: StudentResponse;
    hcProvider: HealthcareProviderResponse;
}

export class UserVaccination {
  _id: String;
  batchCode: String;
  type: VaccineType;
  name: String;
}
