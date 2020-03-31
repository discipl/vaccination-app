import {Place} from './place-model';
import {VaccineType} from './vaccines.model';

export class Vaccine {
  batchCode: string;
  type: VaccineType;
}

export class Appointment {
    _id: string;
    vaccines: Vaccine[];
    chosenDate: string;
    place: Place;
    status: AppointmentStatus;
    availableActions: AvailableAction[];
    hcProvider: userDetail;
    student: userDetail;
    eventType: EventType;
}

export enum AvailableAction {
    SHARE_TOKEN = 'SHARE_TOKEN',
    CONFIRM_OPPONENT = 'CONFIRM_OPPONENT',
    FINISH = 'FINISH'
}

export enum AppointmentStatus {
    NEW = 'NEW',
    REGISTERED = 'REGISTERED',
    CONFIRMED_BY_STUDENT = 'CONFIRMED_BY_STUDENT',
    CONFIRMED_BY_HEALTHCARE_PROVIDER = 'CONFIRMED_BY_HEALTHCARE_PROVIDER',
    CONFIRMED = 'CONFIRMED',
    FINISHED_BY_STUDENT = 'FINISHED_BY_STUDENT',
    FINISHED_BY_HEALTHCARE_PROVIDER = 'FINISHED_BY_HEALTHCARE_PROVIDER',
    FINISHED = 'FINISHED'
}

export class userDetail {
    _id: string;
    firstName: string;
    lastName: string;
}

export const DEFAULT_POSITION = {
    lat: 43.0741904,
    lng: -89.3809802
};

export class AppointmentActionRequest {
  action: AvailableAction;
  token?: string;
  batchCode?: string;
  chosenDate?: string;
}

export enum EventType {
    Vaccination = 'VACCINATION',
    BloodTest = 'BLOOD_TEST'
}
