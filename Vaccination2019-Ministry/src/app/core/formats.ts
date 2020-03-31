// https://momentjs.com/docs/#/displaying/format/ form more information
import * as textMask from 'vanilla-text-mask/dist/vanillaTextMask';
import { formatDate as defaultFormatDate } from '@angular/common';

export function formatDate(date) {
  try {
    return defaultFormatDate(date, 'dd-MM-yyyy', 'en-US');
  } catch (e) {
    return date;
  }
}

export const MY_DATE_FORMATS = {
  parse: {
    dateInput: 'DD-MM-YYYY',
  },
  display: {
    dateInput: 'DD-MM-YYYY',
    monthYearLabel: 'MMMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MM YYYY',
  },
};

export function dateInputMask(input) {
  textMask.maskInput({
    inputElement: input,
    mask: [ /\d/, /\d/, '-', /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/],
    guide: false,
  });
}

export function integerInputMask(input) {
  textMask.maskInput({
    inputElement: input.element.nativeElement,
    mask: () => {
      const mask = [];
      for (let i = 0; i < 10; i++) {
        mask.push(/\d/);
      }
      return mask;
    },
    guide: false,
  });
}
