import { LineSeries, type IChartApi, type ISeriesApi } from 'lightweight-charts'
import {
  calculateEma,
  calculateSessionVwap,
  calculateSma,
} from './chart-indicators'
import type { ChartCandle, ChartIndicatorState } from './chart-types'

type IndicatorSeriesKey = 'smaSeries' | 'emaSeries' | 'vwapSeries'

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
      '#f59e0b',
      2,
      undefined,
      calculateSma(candles, 9),
    )
    this.syncLineSeries(
      'emaSeries',
      indicators.showEma,
      '#60a5fa',
      2,
      undefined,
      calculateEma(candles, 9),
    )
    this.syncLineSeries(
      'vwapSeries',
      indicators.showVwap,
      '#c084fc',
      2,
      2,
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
