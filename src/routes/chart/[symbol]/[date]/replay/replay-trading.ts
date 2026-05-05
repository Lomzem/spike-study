import type { ChartCandle } from '../chart-types'
import type {
  ReplayClosedTrade,
  ReplayFill,
  ReplayOrderAction,
  ReplayOrderResult,
  ReplayPendingOrder,
  ReplayPosition,
  ReplayPositionSide,
  ReplaySnapshot,
} from './replay-types'

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100
}

function createFill(
  order: ReplayPendingOrder,
  candle: ChartCandle,
  realizedPnl: number,
): ReplayFill {
  return {
    id: createId('fill'),
    orderId: order.id,
    action: order.action,
    shares: order.shares,
    price: candle.open,
    time: candle.time,
    realizedPnl: roundMoney(realizedPnl),
  }
}

function createClosedTrade(
  position: ReplayPosition,
  price: number,
  time: number,
): ReplayClosedTrade {
  const realizedPnl =
    position.side === 'long'
      ? (price - position.averagePrice) * position.shares
      : (position.averagePrice - price) * position.shares

  return {
    id: createId('trade'),
    side: position.side,
    shares: position.shares,
    entryPrice: position.averagePrice,
    exitPrice: price,
    openedAt: position.openedAt,
    closedAt: time,
    realizedPnl: roundMoney(realizedPnl),
  }
}

function addToPosition(
  position: ReplayPosition | null,
  side: ReplayPositionSide,
  shares: number,
  price: number,
  time: number,
) {
  if (!position) {
    return {
      side,
      shares,
      averagePrice: price,
      openedAt: time,
    } satisfies ReplayPosition
  }

  const totalShares = position.shares + shares
  const totalCost = position.averagePrice * position.shares + price * shares

  return {
    ...position,
    shares: totalShares,
    averagePrice: roundMoney(totalCost / totalShares),
  }
}

function canOpenLong(
  snapshot: ReplaySnapshot,
  shares: number,
  referencePrice: number,
) {
  return shares * referencePrice <= snapshot.cash
}

function canOpenShort(
  snapshot: ReplaySnapshot,
  shares: number,
  referencePrice: number,
) {
  return (
    shares * referencePrice <= calculateReplayEquity(snapshot, referencePrice)
  )
}

export function submitReplayOrder({
  snapshot,
  action,
  shares,
  submittedAt,
  referencePrice,
}: {
  snapshot: ReplaySnapshot
  action: ReplayOrderAction
  shares: number
  submittedAt: number
  referencePrice: number | null
}): ReplayOrderResult {
  const normalizedShares = Math.trunc(shares)

  if (snapshot.pendingOrders.length > 0) {
    return {
      ok: false,
      snapshot,
      error: 'Wait for the pending market order to fill first.',
    }
  }

  if (action === 'close') {
    if (!snapshot.position) {
      return {
        ok: false,
        snapshot,
        error: 'There is no open position to close.',
      }
    }
  } else if (normalizedShares <= 0) {
    return {
      ok: false,
      snapshot,
      error: 'Enter a share size greater than zero.',
    }
  }

  if ((action === 'buy' || action === 'sell-short') && referencePrice == null) {
    return {
      ok: false,
      snapshot,
      error: 'The replay needs a visible price before you can place an order.',
    }
  }

  if (action === 'buy') {
    if (snapshot.position?.side === 'short') {
      return {
        ok: false,
        snapshot,
        error: 'Close the short position before opening a long position.',
      }
    }

    if (!canOpenLong(snapshot, normalizedShares, referencePrice ?? 0)) {
      return {
        ok: false,
        snapshot,
        error: 'Not enough cash for that long order.',
      }
    }
  }

  if (action === 'sell-short') {
    if (snapshot.position?.side === 'long') {
      return {
        ok: false,
        snapshot,
        error: 'Close the long position before opening a short position.',
      }
    }

    if (!canOpenShort(snapshot, normalizedShares, referencePrice ?? 0)) {
      return {
        ok: false,
        snapshot,
        error: 'The short order is too large for the current account equity.',
      }
    }
  }

  const orderShares =
    action === 'close' ? (snapshot.position?.shares ?? 0) : normalizedShares
  const nextOrder: ReplayPendingOrder = {
    id: createId('order'),
    action,
    shares: orderShares,
    submittedAt,
  }

  return {
    ok: true,
    snapshot: {
      ...snapshot,
      pendingOrders: [...snapshot.pendingOrders, nextOrder],
    },
  }
}

export function applyReplayTradingToRange(
  snapshot: ReplaySnapshot,
  candles: Array<ChartCandle>,
  fromIndexExclusive: number,
  toIndexInclusive: number,
) {
  let nextSnapshot = snapshot

  for (
    let index = fromIndexExclusive + 1;
    index <= toIndexInclusive;
    index += 1
  ) {
    const candle = candles[index]
    if (!candle) {
      continue
    }

    nextSnapshot = fillReplayOrdersAtCandle(nextSnapshot, candle)
  }

  return nextSnapshot
}

function fillReplayOrdersAtCandle(
  snapshot: ReplaySnapshot,
  candle: ChartCandle,
) {
  if (snapshot.pendingOrders.length === 0) {
    return snapshot
  }

  const nextPendingOrders: Array<ReplayPendingOrder> = []
  let cash = snapshot.cash
  let position = snapshot.position
  const fills = [...snapshot.fills]
  const closedTrades = [...snapshot.closedTrades]

  for (const order of snapshot.pendingOrders) {
    if (candle.time <= order.submittedAt) {
      nextPendingOrders.push(order)
      continue
    }

    if (order.action === 'buy') {
      cash = roundMoney(cash - order.shares * candle.open)
      position = addToPosition(
        position,
        'long',
        order.shares,
        candle.open,
        candle.time,
      )
      fills.push(createFill(order, candle, 0))
      continue
    }

    if (order.action === 'sell-short') {
      cash = roundMoney(cash + order.shares * candle.open)
      position = addToPosition(
        position,
        'short',
        order.shares,
        candle.open,
        candle.time,
      )
      fills.push(createFill(order, candle, 0))
      continue
    }

    if (!position) {
      continue
    }

    const closedTrade = createClosedTrade(position, candle.open, candle.time)
    cash = roundMoney(
      position.side === 'long'
        ? cash + position.shares * candle.open
        : cash - position.shares * candle.open,
    )
    fills.push(createFill(order, candle, closedTrade.realizedPnl))
    closedTrades.push(closedTrade)
    position = null
  }

  return {
    ...snapshot,
    cash,
    position,
    pendingOrders: nextPendingOrders,
    fills,
    closedTrades,
  }
}

export function getReplayPositionMarketValue(
  position: ReplayPosition | null,
  price: number | null,
) {
  if (!position || price == null) {
    return 0
  }

  const grossValue = position.shares * price
  return position.side === 'long' ? grossValue : -grossValue
}

export function getReplayUnrealizedPnl(
  position: ReplayPosition | null,
  price: number | null,
) {
  if (!position || price == null) {
    return 0
  }

  const pnlPerShare =
    position.side === 'long'
      ? price - position.averagePrice
      : position.averagePrice - price

  return roundMoney(pnlPerShare * position.shares)
}

export function calculateReplayEquity(
  snapshot: Pick<ReplaySnapshot, 'cash' | 'position'>,
  price: number | null,
) {
  return roundMoney(
    snapshot.cash + getReplayPositionMarketValue(snapshot.position, price),
  )
}

export function getReplayRealizedPnl(
  snapshot: Pick<ReplaySnapshot, 'closedTrades'>,
) {
  return roundMoney(
    snapshot.closedTrades.reduce((sum, trade) => sum + trade.realizedPnl, 0),
  )
}
