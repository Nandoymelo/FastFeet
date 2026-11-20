import { Recipient } from '@/domain/fastFee/enterprise/entities/recipient'

export class RecipientPresenter {
  static toHTTP(recipient: Recipient) {
    return {
      id: recipient.id.toString(),
      name: recipient.name,
      address: recipient.address,
      latitude: recipient.latitude,
      longitude: recipient.longitude,
    }
  }
}
