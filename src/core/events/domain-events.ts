import type { AggregateRoot } from '../entities/aggregate-root'
import { UniqueEntityID } from '../entities/unique-entity-id'
import type { DomainEvent } from './domain-event'

type DomainEventCallback = (event: any) => void

export class DomainEvents {
  private static handlersMap: Record<string, DomainEventCallback[]> = {}
  private static markedAggregates: AggregateRoot<any>[] = []

  public static markAggregateForDispatch(aggregate: AggregateRoot<any>) {
    // Compara a instância, e não o id: duas requisições podem carregar o mesmo
    // agregado, e os eventos de uma não podem esconder os da outra.
    if (!this.markedAggregates.includes(aggregate)) {
      this.markedAggregates.push(aggregate)
    }
  }

  private static dispatchAggregateEvents(aggregate: AggregateRoot<any>) {
    aggregate.domainEvents.forEach((event: DomainEvent) => this.dispatch(event))
  }

  private static removeAggregateFromMarkedDispatchList(
    aggregate: AggregateRoot<any>,
  ) {
    const index = this.markedAggregates.indexOf(aggregate)

    if (index >= 0) {
      this.markedAggregates.splice(index, 1)
    }
  }

  private static findMarkedAggregateByID(
    id: UniqueEntityID,
  ): AggregateRoot<any> | undefined {
    return this.markedAggregates.find((aggregate) => aggregate.id.equals(id))
  }

  public static dispatchEventsForAggregate(id: UniqueEntityID) {
    const aggregate = this.findMarkedAggregateByID(id)

    if (aggregate) {
      this.dispatchEvents(aggregate)
    }
  }

  public static dispatchEvents(aggregate: AggregateRoot<any>) {
    this.dispatchAggregateEvents(aggregate)
    this.discardEvents(aggregate)
  }

  // Descarta sem disparar: usado quando a mudança não chegou a ser gravada
  public static discardEvents(aggregate: AggregateRoot<any>) {
    aggregate.clearEvents()
    this.removeAggregateFromMarkedDispatchList(aggregate)
  }

  public static register(
    callback: DomainEventCallback,
    eventClassName: string,
  ) {
    const handlers = this.handlersMap[eventClassName] ?? []

    handlers.push(callback)

    this.handlersMap[eventClassName] = handlers
  }

  public static clearHandlers() {
    this.handlersMap = {}
  }

  public static clearMarkedAggregates() {
    this.markedAggregates = []
  }

  private static dispatch(event: DomainEvent) {
    const eventClassName: string = event.constructor.name

    const handlers = this.handlersMap[eventClassName]

    if (!handlers) return

    for (const handler of handlers) {
      handler(event)
    }
  }
}
