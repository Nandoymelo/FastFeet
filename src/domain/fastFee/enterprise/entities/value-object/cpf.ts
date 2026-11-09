import { ValueObject } from '@/core/entities/value-object'

interface CpfProps {
  value: string
}

export class Cpf extends ValueObject<CpfProps> {
  get value() {
    return this.props.value
  }

  // 000.000.000-00
  get formatted() {
    return this.props.value.replace(
      /(\d{3})(\d{3})(\d{3})(\d{2})/,
      '$1.$2.$3-$4',
    )
  }

  toString() {
    return this.props.value
  }

  // Aceita com ou sem pontuação e devolve só os 11 dígitos
  static normalize(raw: string) {
    return raw.replace(/\D/g, '')
  }

  static isValid(raw: string) {
    const digits = Cpf.normalize(raw)

    if (digits.length !== 11) {
      return false
    }

    // 111.111.111-11, 000.000.000-00 etc. passam na conta, mas não são válidos
    if (/^(\d)\1{10}$/.test(digits)) {
      return false
    }

    const firstDigit = Cpf.calculateCheckDigit(digits, 9)
    const secondDigit = Cpf.calculateCheckDigit(digits, 10)

    return (
      firstDigit === Number(digits[9]) && secondDigit === Number(digits[10])
    )
  }

  private static calculateCheckDigit(digits: string, length: number) {
    let sum = 0

    for (let i = 0; i < length; i++) {
      sum += Number(digits[i]) * (length + 1 - i)
    }

    const remainder = (sum * 10) % 11

    return remainder === 10 ? 0 : remainder
  }

  static create(raw: string) {
    if (!Cpf.isValid(raw)) {
      throw new Error('Invalid CPF.')
    }

    return new Cpf({ value: Cpf.normalize(raw) })
  }
}
