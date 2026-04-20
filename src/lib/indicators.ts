import type {
  CandlestickData,
  LineData,
  UTCTimestamp,
  WhitespaceData,
} from 'lightweight-charts'

export type IntradayCandleData = CandlestickData<UTCTimestamp> & {
  volume: number
}

type IndicatorPoint = LineData<UTCTimestamp> | WhitespaceData<UTCTimestamp>

function toWhitespacePoint(time: UTCTimestamp): WhitespaceData<UTCTimestamp> {
  return { time }
}

export function calculateSma(
  candles: Array<IntradayCandleData>,
  length: number,
): Array<IndicatorPoint> {
  const points: Array<IndicatorPoint> = []
  let sum = 0

  for (let index = 0; index < candles.length; index += 1) {
    sum += candles[index].close

    if (index >= length) {
      sum -= candles[index - length].close
    }

    if (index < length - 1) {
      points.push(toWhitespacePoint(candles[index].time))
      continue
    }

    points.push({
      time: candles[index].time,
      value: sum / length,
    })
  }

  return points
}

export function calculateEma(
  candles: Array<IntradayCandleData>,
  length: number,
): Array<IndicatorPoint> {
  const points: Array<IndicatorPoint> = []
  const multiplier = 2 / (length + 1)
  let ema: number | null = null

  for (let index = 0; index < candles.length; index += 1) {
    const candle = candles[index]

    if (ema === null) {
      ema = candle.close
    } else {
      ema = candle.close * multiplier + ema * (1 - multiplier)
    }

    if (index < length - 1) {
      points.push(toWhitespacePoint(candle.time))
      continue
    }

    points.push({
      time: candle.time,
      value: ema,
    })
  }

  return points
}

export function calculateSessionVwap(
  candles: Array<IntradayCandleData>,
): Array<IndicatorPoint> {
  const points: Array<IndicatorPoint> = []
  let cumulativePriceVolume = 0
  let cumulativeVolume = 0

  for (const candle of candles) {
    const typicalPrice = (candle.high + candle.low + candle.close) / 3
    cumulativePriceVolume += typicalPrice * candle.volume
    cumulativeVolume += candle.volume

    if (cumulativeVolume <= 0) {
      points.push(toWhitespacePoint(candle.time))
      continue
    }

    points.push({
      time: candle.time,
      value: cumulativePriceVolume / cumulativeVolume,
    })
  }

  return points
}
