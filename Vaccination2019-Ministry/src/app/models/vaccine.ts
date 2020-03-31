import {PaginationResponse} from './paginationResponse';

export class Vaccine {
  _id: String;
  batchCode: String;
  type: String;
  name: String;
  price: Number;
  bloodTestPrice: Number;
  initialAmount: Number;
  availableAmount: Number;
  finishedAmount: Number;
}

export class VaccineType {
  _id: String;
  producer: String;
  drug: String;
  dosage: String;
  comment: String;

  toString() {
    return `${this.producer}, ${this.drug}, ${this.dosage}`;
  }
}

export class VaccinesResponse extends PaginationResponse<Vaccine> {
}
