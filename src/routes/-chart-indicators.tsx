import { createContext, useContext } from 'react'

export interface IndicatorState {
  showSma: boolean
  showEma: boolean
  showVwap: boolean
}

export interface ChartIndicatorContextValue extends IndicatorState {
  toggleIndicator: (indicator: keyof IndicatorState) => void
}

export const ChartIndicatorContext =
  createContext<ChartIndicatorContextValue | null>(null)

export function useChartIndicators() {
  const context = useContext(ChartIndicatorContext)

  if (!context) {
    throw new Error('useChartIndicators must be used within the chart route')
  }

  return context
}
