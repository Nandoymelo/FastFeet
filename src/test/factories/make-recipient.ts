import {
  Recipient,
  type RecipientProps,
} from '@/domain/fastFee/enterprise/entities/recipient'
import { faker } from '@faker-js/faker'

export function MakeRecipient(override: Partial<RecipientProps> = {}) {
  const recipient = Recipient.create({
    name: faker.person.fullName(),
    address: faker.location.streetAddress(),
    longitude: faker.location.longitude(),
    latitude: faker.location.latitude(),
    ...override,
  })

  return recipient
}
