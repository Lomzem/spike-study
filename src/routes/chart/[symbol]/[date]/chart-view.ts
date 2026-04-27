import {
  CandlestickSeries,
  ColorType,
  HistogramSeries,
  createChart,
  type CandlestickData,
  type HistogramData,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from 'lightweight-charts'
import type { ChartCandle } from './chart-types'

export interface ChartView {
  chart: IChartApi
  candlestickSeries: ISeriesApi<'Candlestick'>
  volumeSeries: ISeriesApi<'Histogram'>
}

export function createChartView(element: HTMLElement): ChartView {
  const chart = createChart(element, {
    width: element.clientWidth,
    height: element.clientHeight,
    layout: {
      background: { type: ColorType.Solid, color: 'transparent' },
      textColor: '#8b95a7',
      fontFamily: 'var(--font-sans)',
      fontSize: 12,
    },
    grid: {
      vertLines: { color: 'rgba(139, 149, 167, 0.08)' },
      horzLines: { color: 'rgba(139, 149, 167, 0.08)' },
    },
    crosshair: {
      vertLine: {
        color: 'rgba(245, 158, 11, 0.35)',
        labelBackgroundColor: '#111827',
      },
      horzLine: {
        color: 'rgba(245, 158, 11, 0.35)',
        labelBackgroundColor: '#111827',
      },
    },
    rightPriceScale: {
      borderColor: 'rgba(139, 149, 167, 0.12)',
    },
    timeScale: {
      timeVisible: true,
      secondsVisible: false,
      borderColor: 'rgba(139, 149, 167, 0.12)',
    },
  })

  const candlestickSeries = chart.addSeries(CandlestickSeries, {
    upColor: '#5a8a5c',
    downColor: '#c4783a',
    borderVisible: false,
    wickUpColor: '#5a8a5c',
    wickDownColor: '#c4783a',
    priceLineVisible: false,
    lastValueVisible: false,
  })

  const volumeSeries = chart.addSeries(
    HistogramSeries,
    {
      priceFormat: { type: 'volume' },
      priceScaleId: '',
      lastValueVisible: false,
      priceLineVisible: false,
    },
    1,
  )

  const panes = chart.panes()
  if (panes.length > 1) {
    panes[0].setHeight((element.clientHeight * 3) / 4)
  }

  return {
    chart,
    candlestickSeries,
    volumeSeries,
  }
}

export function setChartViewData(view: ChartView, candles: Array<ChartCandle>) {
  view.candlestickSeries.setData(toCandlestickData(candles))
  view.volumeSeries.setData(toVolumeData(candles))
}

export function fitChartViewContent(view: ChartView) {
  view.chart.timeScale().fitContent()
}

function toCandlestickData(
  candles: Array<ChartCandle>,
): Array<CandlestickData<UTCTimestamp>> {
  return candles.map((candle) => ({
    time: candle.time,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
  }))
}

function toVolumeData(
  candles: Array<ChartCandle>,
): Array<HistogramData<UTCTimestamp>> {
  return candles.map((candle) => ({
    time: candle.time,
    value: candle.volume,
    color:
      candle.close >= candle.open
        ? 'rgba(90, 138, 92, 0.45)'
        : 'rgba(196, 120, 58, 0.45)',
  }))
}
