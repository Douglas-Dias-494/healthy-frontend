import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Política de senha (a mesma do backend, que valida de novo): 8 a 72 caracteres, ao menos uma letra e um número.
 * A lista de "senhas comuns" só existe no servidor; se ele recusar, a mensagem dele é exibida.
 */
export function strongPassword(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value: string = control.value ?? '';
    if (value === '') {
      return null; // vazio é problema do Validators.required
    }
    const bytes = new TextEncoder().encode(value).length;
    const valid = value.length >= 8 && bytes <= 72 && /\p{L}/u.test(value) && /\d/.test(value);
    return valid ? null : { weakPassword: true };
  };
}

/**
 * Validador de GRUPO: confere se dois campos têm o mesmo valor (senha e confirmação).
 * O erro fica no grupo (form.hasError('senhasDiferentes')), não em um dos campos.
 */
export function fieldsMatch(field: string, confirmField: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const value = group.get(field)?.value;
    const confirmation = group.get(confirmField)?.value;
    return value === confirmation ? null : { senhasDiferentes: true };
  };
}

/** Só os dígitos de um texto: "529.982.247-25" vira "52998224725". */
export function onlyDigits(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '');
}

/** "52998224725" vira "529.982.247-25" (só para exibir). */
export function formatCpf(digits: string | null | undefined): string {
  const d = onlyDigits(digits);
  return d.length === 11
    ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
    : (digits ?? '');
}

/** "11987654321" vira "(11) 98765-4321" (só para exibir). */
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

/** CPF válido: 11 dígitos, não todos iguais, e os dois dígitos verificadores corretos. */
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

/** Aceita o CPF com ou sem máscara. */
export function cpf(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value: string = control.value ?? '';
    return value === '' || isValidCpf(value) ? null : { cpf: true };
  };
}

/** Telefone brasileiro com DDD (10 ou 11 dígitos), com ou sem máscara. Vazio é permitido. */
export function phone(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value: string = control.value ?? '';
    const digits = onlyDigits(value);
    return value === '' || digits.length === 10 || digits.length === 11 ? null : { phone: true };
  };
}

/** Data (yyyy-MM-dd) que não seja futura. Compara como texto, que funciona para o formato ISO. */
export function notInFuture(today: () => string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value: string = control.value ?? '';
    return value === '' || value <= today() ? null : { future: true };
  };
}
