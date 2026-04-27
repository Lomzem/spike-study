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
  smaSeries: ISeriesApi<'Line'>
  emaSeries: ISeriesApi<'Line'>
  vwapSeries: ISeriesApi<'Line'>
}

export class ChartIndicatorSeries {
  private chart: IChartApi
  private series: IndicatorSeriesState

  constructor(chart: IChartApi) {
    this.chart = chart
    this.series = {
      smaSeries: this.createLineSeries(
        SMA_COLOR,
        DEFAULT_LINE_WIDTH,
        undefined,
      ),
      emaSeries: this.createLineSeries(
        EMA_COLOR,
        DEFAULT_LINE_WIDTH,
        undefined,
      ),
      vwapSeries: this.createLineSeries(
        VWAP_COLOR,
        DEFAULT_LINE_WIDTH,
        VWAP_LINE_STYLE,
      ),
    }
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
    this.chart.removeSeries(this.series.smaSeries)
    this.chart.removeSeries(this.series.emaSeries)
    this.chart.removeSeries(this.series.vwapSeries)
  }

  private syncLineSeries(
    key: IndicatorSeriesKey,
    enabled: boolean,
    color: string,
    lineWidth: 1 | 2 | 3 | 4,
    lineStyle: 0 | 1 | 2 | 3 | 4 | undefined,
    data: Parameters<ISeriesApi<'Line'>['setData']>[0],
  ) {
    const series = this.series[key]

    series.applyOptions({ color, lineWidth, lineStyle, visible: enabled })

    series.setData(data)
  }

  private createLineSeries(
    color: string,
    lineWidth: 1 | 2 | 3 | 4,
    lineStyle: 0 | 1 | 2 | 3 | 4 | undefined,
  ) {
    return this.chart.addSeries(LineSeries, {
      color,
      lineWidth,
      lineStyle,
      visible: false,
      lastValueVisible: false,
      priceLineVisible: false,
    })
  }
}
