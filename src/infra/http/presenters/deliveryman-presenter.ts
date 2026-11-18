import { User } from '@/domain/fastFee/enterprise/entities/user'

export class DeliverymanPresenter {
  static toHTTP(user: User) {
    return {
      id: user.id.toString(),
      name: user.name,
      cpf: user.cpf.value,
    }
  }
}
