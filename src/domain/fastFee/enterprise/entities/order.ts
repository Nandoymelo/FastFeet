import { Entity } from '@/core/entities/entity'
import type { UniqueEntityID } from '@/core/entities/unique-entity-id'
import type { Optional } from '@/core/types/optional'

export interface OrderProps {
  recipientId: UniqueEntityID
  deliverymanId?: UniqueEntityID
  deliveryPhotoUrl?: string
  createdAt: Date
  availableAt?: Date
  pickedUpAt?: Date
  deliveredAt?: Date
  returnedAt?: Date
}

export class Order extends Entity<OrderProps> {
  get recipientId() {
    return this.props.recipientId
  }

  get deliverymanId() {
    return this.props.deliverymanId
  }

  get createdAt() {
    return this.props.createdAt
  }

  get availableAt() {
    return this.props.availableAt
  }

  get pickedUpAt() {
    return this.props.pickedUpAt
  }

  get deliveredAt() {
    return this.props.deliveredAt
  }

  get returnedAt() {
    return this.props.returnedAt
  }

  get deliveryPhotoUrl() {
    return this.props.deliveryPhotoUrl
  }

  changeRecipient(recipientId: UniqueEntityID) {
    if (this.props.pickedUpAt) {
      throw new Error('Order cannot be edited after pickup.')
    }

    this.props.recipientId = recipientId
  }

  canBeDeleted() {
    return !this.props.pickedUpAt
  }

  makeAvailable() {
    this.props.availableAt = new Date()
  }

  canBeMadeAvailable() {
    return (
      !this.props.availableAt &&
      !this.props.pickedUpAt &&
      !this.props.returnedAt
    )
  }

  canBePickedUp() {
    return (
      !!this.props.availableAt &&
      !this.props.pickedUpAt &&
      !this.props.deliveredAt &&
      !this.props.returnedAt
    )
  }

  canBeDelivered() {
    return (
      !!this.props.availableAt &&
      !!this.props.pickedUpAt &&
      !this.props.deliveredAt &&
      !this.props.returnedAt
    )
  }

  canBeReturned() {
    return (
      !!this.props.availableAt &&
      !!this.props.pickedUpAt &&
      !!this.props.deliveredAt &&
      !this.props.returnedAt
    )
  }

  canBeReturnedBy(deliverymanId: UniqueEntityID) {
    return (
      this.canBeReturned() && this.props.deliverymanId?.equals(deliverymanId)
    )
  }

  delivered(deliverymanId: UniqueEntityID, photoUrl: string) {
    if (!this.canBeDelivered()) {
      throw new Error('Order cannot be delivered.')
    }

    if (!this.props.deliverymanId?.equals(deliverymanId)) {
      throw new Error('Deliveryman is not authorized.')
    }
    this.props.deliveryPhotoUrl = photoUrl
    this.props.deliveredAt = new Date()
  }

  returned(deliverymanId: UniqueEntityID) {
    if (!this.canBeReturned()) {
      throw new Error('Order cannot be returned.')
    }

    if (!this.props.deliverymanId?.equals(deliverymanId)) {
      throw new Error('Deliveryman is not authorized.')
    }
    this.props.returnedAt = new Date()
  }

  pickUp(deliverymanId: UniqueEntityID) {
    if (!this.canBePickedUp()) {
      throw new Error('Order is not available for pickup.')
    }

    this.props.deliverymanId = deliverymanId
    this.props.pickedUpAt = new Date()
  }

  deliver() {
    this.props.deliveredAt = new Date()
  }

  return() {
    this.props.returnedAt = new Date()
  }

  static create(props: Optional<OrderProps, 'createdAt'>, id?: UniqueEntityID) {
    const order = new Order(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )

    return order
  }
}
