import { PaginationResponse } from './paginationResponse';
import { Vaccine } from './vaccine';

export enum EventType {
  VACCINATION = 'VACCINATION',
  BLOOD_TEST = 'BLOOD_TEST'
}

export class Vaccination {
  steps: Event[];
  vaccines: Vaccine[];
  _id: String;
}

export class Event {
  _id: String;
  type: String;
  vaccinationEvent: String;
  bloodTest: String;
  allowedDates: Date[] = [];
  place: {
    name: String,
    address: String,
    addressDetails: {
      streetNumber: String,
      streetAddress: String,
      city: String,
      state: String,
      zipCode: Number,
      country: String,
    },
    latitude: Number,
    longitude: Number,
  };
  availableCount: Number;
  initialCount: Number;
}

export class VaccinationsResponse extends PaginationResponse<Vaccination> {
}
