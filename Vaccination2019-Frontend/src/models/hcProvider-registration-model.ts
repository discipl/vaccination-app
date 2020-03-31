import { Address } from './student-registration-model';

export class HealthcareProviderRequest {
    bigId: string;
    password: string;
}

export class HealthcareProviderResponse {
    diploma: string;
    vaccinationDiploma: boolean;
    healthcareProvider: HealthcareProvider;
}

export class HealthcareProvider {
    name: string;
    address: Address;
}