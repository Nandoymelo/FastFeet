import { Entity } from '@/core/entities/entity'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'

interface RecipientProps {
  name: string
  address: string
  longitude: number
  latitude: number
}

export class Recipient extends Entity<RecipientProps> {
  get name() {
    return this.props.name
  }

  get address() {
    return this.props.address
  }

  get longitude() {
    return this.props.longitude
  }

  get latitude() {
    return this.props.latitude
  }

  static create(props: RecipientProps, id?: UniqueEntityID) {
    const recipient = new Recipient(props, id)

    return recipient
  }
}
