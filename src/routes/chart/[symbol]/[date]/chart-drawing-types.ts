export type SavedLineStyle = 0 | 1 | 2 | 3 | 4

export interface SavedPriceLine {
  id: string
  price: number
  color: string
  lineWidth: number
  lineStyle: SavedLineStyle
}
