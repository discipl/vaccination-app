import {PaginationResponse} from "./paginationResponse";
import {Vaccine} from "./appointments-model";
import {Place} from "./place-model";

export class Event {
  _id: string;
  type: string;
  vaccines: Vaccine[];
  place: Place;
  allowedDates: string[] = [];
}


export class EventsResponse extends PaginationResponse<Event> {
}