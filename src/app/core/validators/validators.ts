import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Mirrors the backend password policy (the server also rejects common passwords). */
export function strongPassword(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value: string = control.value ?? '';
    if (value === '') {
      return null;
    }
    const bytes = new TextEncoder().encode(value).length;
    const valid = value.length >= 8 && bytes <= 72 && /\p{L}/u.test(value) && /\d/.test(value);
    return valid ? null : { weakPassword: true };
  };
}

/** Group-level validator: compares two fields. The error is set on the group, not on a field. */
export function fieldsMatch(field: string, confirmField: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const value = group.get(field)?.value;
    const confirmation = group.get(confirmField)?.value;
    return value === confirmation ? null : { senhasDiferentes: true };
  };
}

export function onlyDigits(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '');
}

export function formatCpf(digits: string | null | undefined): string {
  const d = onlyDigits(digits);
  return d.length === 11
    ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
    : (digits ?? '');
}

export function formatPhone(digits: string | null | undefined): string {
  const d = onlyDigits(digits);
  if (d.length === 11) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }
  if (d.length === 10) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  }
  return digits ?? '';
}

export function isValidCpf(value: string): boolean {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }
  const check = (length: number): number => {
    let sum = 0;
    for (let i = 0; i < length; i++) {
      sum += Number(cpf[i]) * (length + 1 - i);
    }
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return check(9) === Number(cpf[9]) && check(10) === Number(cpf[10]);
}

export function cpf(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value: string = control.value ?? '';
    return value === '' || isValidCpf(value) ? null : { cpf: true };
  };
}

export function phone(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value: string = control.value ?? '';
    const digits = onlyDigits(value);
    return value === '' || digits.length === 10 || digits.length === 11 ? null : { phone: true };
  };
}

export function notInFuture(today: () => string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value: string = control.value ?? '';
    return value === '' || value <= today() ? null : { future: true };
  };
}
