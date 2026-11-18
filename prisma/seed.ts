import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'
import { Cpf } from '../src/domain/fastFee/enterprise/entities/value-object/cpf'

const prisma = new PrismaClient()

const ADMIN_CPF = Cpf.normalize('117.569.880-64')

async function seed() {
  const adminExists = await prisma.user.findFirst({
    where: {
      role: 'ADMIN',
    },
  })

  if (adminExists) {
    // Admins criados antes da normalização foram salvos com pontuação
    if (adminExists.cpf !== Cpf.normalize(adminExists.cpf)) {
      await prisma.user.update({
        where: { id: adminExists.id },
        data: { cpf: Cpf.normalize(adminExists.cpf) },
      })
      console.log('CPF do administrador normalizado.')
    }

    console.log('Administrador já existe.')
    return
  }

  const passwordHash = await hash('12345', 8)

  await prisma.user.create({
    data: {
      name: 'Administrador',
      cpf: ADMIN_CPF,
      passwordHash,
      role: 'ADMIN',
    },
  })

  console.log('Administrador criado com sucesso!')
}

seed()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
