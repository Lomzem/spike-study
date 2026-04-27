import { LineSeries, type IChartApi, type ISeriesApi } from 'lightweight-charts'
import {
  calculateEma,
  calculateSessionVwap,
  calculateSma,
} from './chart-indicators'
import type { ChartCandle, ChartIndicatorState } from './chart-types'

type IndicatorSeriesKey = 'smaSeries' | 'emaSeries' | 'vwapSeries'

const SMA_LENGTH = 9
const EMA_LENGTH = 9
const DEFAULT_LINE_WIDTH: 1 | 2 | 3 | 4 = 2
const SMA_COLOR = '#f59e0b'
const EMA_COLOR = '#60a5fa'
const VWAP_COLOR = '#c084fc'
const VWAP_LINE_STYLE: 0 | 1 | 2 | 3 | 4 = 2

interface IndicatorSeriesState {
  smaSeries: ISeriesApi<'Line'> | null
  emaSeries: ISeriesApi<'Line'> | null
  vwapSeries: ISeriesApi<'Line'> | null
}

export class ChartIndicatorSeries {
  private chart: IChartApi
  private series: IndicatorSeriesState = {
    smaSeries: null,
    emaSeries: null,
    vwapSeries: null,
  }

  constructor(chart: IChartApi) {
    this.chart = chart
  }

  sync(indicators: ChartIndicatorState, candles: Array<ChartCandle>) {
    this.syncLineSeries(
      'smaSeries',
      indicators.showSma,
      SMA_COLOR,
      DEFAULT_LINE_WIDTH,
      undefined,
      calculateSma(candles, SMA_LENGTH),
    )
    this.syncLineSeries(
      'emaSeries',
      indicators.showEma,
      EMA_COLOR,
      DEFAULT_LINE_WIDTH,
      undefined,
      calculateEma(candles, EMA_LENGTH),
    )
    this.syncLineSeries(
      'vwapSeries',
      indicators.showVwap,
      VWAP_COLOR,
      DEFAULT_LINE_WIDTH,
      VWAP_LINE_STYLE,
      calculateSessionVwap(candles),
    )
  }

  removeAll() {
    this.removeSeries('smaSeries')
    this.removeSeries('emaSeries')
    this.removeSeries('vwapSeries')
  }

  private syncLineSeries(
    key: IndicatorSeriesKey,
    enabled: boolean,
    color: string,
    lineWidth: 1 | 2 | 3 | 4,
    lineStyle: 0 | 1 | 2 | 3 | 4 | undefined,
    data: Parameters<ISeriesApi<'Line'>['setData']>[0],
  ) {
    if (!enabled) {
      this.removeSeries(key)
      return
    }

    let series = this.series[key]

    if (!series) {
      series = this.chart.addSeries(LineSeries, {
        color,
        lineWidth,
        lineStyle,
        lastValueVisible: false,
        priceLineVisible: false,
      })
      this.series[key] = series
    }

    series.applyOptions({ color, lineWidth, lineStyle })

    series.setData(data)
  }

  private removeSeries(key: IndicatorSeriesKey) {
    if (!this.series[key]) {
      return
    }

    this.chart.removeSeries(this.series[key])
    this.series[key] = null
  }
}
