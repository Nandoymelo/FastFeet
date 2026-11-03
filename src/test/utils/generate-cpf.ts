function calculateCheckDigit(digits: number[]): number {
  // pesos começam em (quantidade de dígitos + 1) e vão diminuindo até 2
  const weightStart = digits.length + 1

  const sum = digits.reduce(
    (total, digit, index) => total + digit * (weightStart - index),
    0,
  )

  const remainder = (sum * 10) % 11

  return remainder === 10 ? 0 : remainder
}

export function generateCpf(): string {
  let base: number[]

  // evita sequências como 111.111.111-11, que têm dígitos "válidos"
  // pela conta, mas são rejeitadas pela maioria das validações
  do {
    base = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10))
  } while (base.every((digit) => digit === base[0]))

  const firstDigit = calculateCheckDigit(base)
  const secondDigit = calculateCheckDigit([...base, firstDigit])

  const digits = [...base, firstDigit, secondDigit].join('')

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}
