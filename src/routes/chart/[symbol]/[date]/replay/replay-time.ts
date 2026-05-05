import type { ChartCandle } from '../chart-types'

export const NEW_YORK_TIME_ZONE = 'America/New_York'
const REGULAR_SESSION_START_HOUR = 9
const REGULAR_SESSION_START_MINUTE = 30

const replayClockFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: NEW_YORK_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

const replayTimePartsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: NEW_YORK_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

interface ReplayTimeParts {
  date: string
  hour: number
  minute: number
  second: number
}

function getReplayTimeParts(timestampSeconds: number): ReplayTimeParts {
  const parts = replayTimePartsFormatter.formatToParts(timestampSeconds * 1000)
  const lookup = new Map(parts.map((part) => [part.type, part.value]))

  return {
    date: `${lookup.get('year')}-${lookup.get('month')}-${lookup.get('day')}`,
    hour: Number(lookup.get('hour') ?? 0),
    minute: Number(lookup.get('minute') ?? 0),
    second: Number(lookup.get('second') ?? 0),
  }
}

export function formatReplayClock(timestampSeconds: number) {
  return replayClockFormatter.format(timestampSeconds * 1000)
}

export function findReplayStartIndex(candles: Array<ChartCandle>) {
  const index = candles.findIndex((candle) => {
    const time = getReplayTimeParts(candle.time)

    return (
      time.hour > REGULAR_SESSION_START_HOUR ||
      (time.hour === REGULAR_SESSION_START_HOUR &&
        time.minute >= REGULAR_SESSION_START_MINUTE)
    )
  })

  return index >= 0 ? index : 0
}

export function getReplayStartTime(candles: Array<ChartCandle>) {
  if (candles.length === 0) {
    return 0
  }

  return candles[findReplayStartIndex(candles)]?.time ?? candles[0].time
}

export function getReplayEndTime(candles: Array<ChartCandle>) {
  return candles.at(-1)?.time ?? 0
}

export function clampReplayTime(candles: Array<ChartCandle>, time: number) {
  if (candles.length === 0) {
    return 0
  }

  return Math.min(
    Math.max(time, getReplayStartTime(candles)),
    getReplayEndTime(candles),
  )
}

export function getRevealedCandleIndex(
  candles: Array<ChartCandle>,
  currentTime: number,
) {
  for (let index = candles.length - 1; index >= 0; index -= 1) {
    if (candles[index].time <= currentTime) {
      return index
    }
  }

  return -1
}

export function getRevealedCandles(
  candles: Array<ChartCandle>,
  revealedCandleIndex: number,
) {
  if (revealedCandleIndex < 0) {
    return []
  }

  const replayStartIndex = findReplayStartIndex(candles)
  return candles.slice(replayStartIndex, revealedCandleIndex + 1)
}

export function isReplayComplete(
  candles: Array<ChartCandle>,
  currentTime: number,
) {
  return candles.length > 0 && currentTime >= getReplayEndTime(candles)
}

export function isSameReplayDate(date: string, timestampSeconds: number) {
  return getReplayTimeParts(timestampSeconds).date === date
}
