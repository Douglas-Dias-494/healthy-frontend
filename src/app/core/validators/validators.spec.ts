import { FormControl, FormGroup } from '@angular/forms';
import {
  cpf,
  fieldsMatch,
  formatCpf,
  formatPhone,
  isValidCpf,
  notInFuture,
  onlyDigits,
  phone,
  strongPassword,
} from './validators';

describe('validators', () => {
  describe('strongPassword', () => {
    const validate = (value: string) => strongPassword()(new FormControl(value));

    it('should accept 8+ characters with a letter and a digit', () => {
      expect(validate('Segredo2026')).toBeNull();
      expect(validate('abcdefg1')).toBeNull();
    });

    it('should reject short passwords and passwords missing a letter or a digit', () => {
      expect(validate('Abc1234')).toEqual({ weakPassword: true });
      expect(validate('somenteletras')).toEqual({ weakPassword: true });
      expect(validate('1234567890')).toEqual({ weakPassword: true });
    });

    it('should reject passwords over the 72-byte BCrypt limit', () => {
      expect(validate('a1' + 'x'.repeat(70))).toBeNull();
      expect(validate('a1' + 'x'.repeat(71))).toEqual({ weakPassword: true });
    });

    it('should leave empty values to Validators.required', () => {
      expect(validate('')).toBeNull();
    });
  });

  describe('fieldsMatch', () => {
    const group = (a: string, b: string) =>
      new FormGroup({ senha: new FormControl(a), confirmar: new FormControl(b) });

    it('should flag the group when the fields differ', () => {
      expect(fieldsMatch('senha', 'confirmar')(group('abc', 'abd'))).toEqual({
        senhasDiferentes: true,
      });
    });

    it('should accept equal fields', () => {
      expect(fieldsMatch('senha', 'confirmar')(group('abc', 'abc'))).toBeNull();
    });
  });

  describe('cpf', () => {
    it('should accept valid CPFs with or without mask', () => {
      expect(isValidCpf('52998224725')).toBe(true);
      expect(isValidCpf('529.982.247-25')).toBe(true);
      expect(isValidCpf('11144477735')).toBe(true);
    });

    it('should reject wrong check digits, repeated digits and wrong lengths', () => {
      expect(isValidCpf('52998224726')).toBe(false);
      expect(isValidCpf('11111111111')).toBe(false);
      expect(isValidCpf('123')).toBe(false);
      expect(isValidCpf('')).toBe(false);
    });

    it('should work as a form validator and ignore empty values', () => {
      expect(cpf()(new FormControl('52998224725'))).toBeNull();
      expect(cpf()(new FormControl('11111111111'))).toEqual({ cpf: true });
      expect(cpf()(new FormControl(''))).toBeNull();
    });
  });

  describe('phone', () => {
    it('should accept 10 or 11 digits with or without mask, and empty', () => {
      expect(phone()(new FormControl('11987654321'))).toBeNull();
      expect(phone()(new FormControl('(11) 3456-7890'))).toBeNull();
      expect(phone()(new FormControl(''))).toBeNull();
    });

    it('should reject other lengths', () => {
      expect(phone()(new FormControl('12345'))).toEqual({ phone: true });
    });
  });

  describe('notInFuture', () => {
    const validate = (value: string) => notInFuture(() => '2026-11-16')(new FormControl(value));

    it('should accept today and the past, reject the future', () => {
      expect(validate('2026-11-16')).toBeNull();
      expect(validate('2026-01-01')).toBeNull();
      expect(validate('2026-11-17')).toEqual({ future: true });
    });
  });

  describe('formatting', () => {
    it('should keep only digits', () => {
      expect(onlyDigits('529.982.247-25')).toBe('52998224725');
      expect(onlyDigits(null)).toBe('');
    });

    it('should format CPF and phone for display', () => {
      expect(formatCpf('52998224725')).toBe('529.982.247-25');
      expect(formatPhone('11987654321')).toBe('(11) 98765-4321');
      expect(formatPhone('1134567890')).toBe('(11) 3456-7890');
    });

    it('should leave unexpected values untouched', () => {
      expect(formatCpf('123')).toBe('123');
      expect(formatCpf(null)).toBe('');
    });
  });
});
