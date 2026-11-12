import { AggregateRoot } from '@/core/entities/aggregate-root'
import type { UniqueEntityID } from '@/core/entities/unique-entity-id'
import type { Optional } from '@/core/types/optional'
import { OrderChangeStatus } from '../events/order-change-status'
import type { OrderStatus } from '@/core/entities/order-status'

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

export class Order extends AggregateRoot<OrderProps> {
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

  get status(): OrderStatus {
    if (this.props.returnedAt) return 'RETURNED'
    if (this.props.deliveredAt) return 'DELIVERED'
    if (this.props.pickedUpAt) return 'PICKED_UP'
    if (this.props.availableAt) return 'AVAILABLE'

    return 'PENDING'
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

  findManyAvailable(): [] {
    return !!this.props.availableAt && this.props.pickedUpAt
  }

  makeAvailable() {
    this.props.availableAt = new Date()
    this.addDomainEvent(new OrderChangeStatus(this))
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
    this.addDomainEvent(new OrderChangeStatus(this))
  }

  returned(deliverymanId: UniqueEntityID) {
    if (!this.canBeReturned()) {
      throw new Error('Order cannot be returned.')
    }

    if (!this.props.deliverymanId?.equals(deliverymanId)) {
      throw new Error('Deliveryman is not authorized.')
    }
    this.props.returnedAt = new Date()
    this.addDomainEvent(new OrderChangeStatus(this))
  }

  pickUp(deliverymanId: UniqueEntityID) {
    if (!this.canBePickedUp()) {
      throw new Error('Order is not available for pickup.')
    }

    this.props.deliverymanId = deliverymanId
    this.props.pickedUpAt = new Date()
    this.addDomainEvent(new OrderChangeStatus(this))
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
