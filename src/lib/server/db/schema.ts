import {
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core'
import type { InferSelectModel } from 'drizzle-orm'

export const dailyStocksTable = sqliteTable(
  'daily_stocks_table',
  {
    date: text({ length: 10 }).notNull(),
    symbol: text({ length: 10 }).notNull(),
    open: real().notNull(),
    high: real().notNull(),
    low: real().notNull(),
    close: real().notNull(),
    volume: integer().notNull(),
    trades: integer(),
    gap: real(),
    range: real().notNull(),
    change: real().notNull(),
    hasIntraday: integer({ mode: 'boolean' }).notNull().default(false),
  },
  (table) => [
    primaryKey({
      columns: [table.date, table.symbol],
    }),
  ],
)

export const intradayStocksTable = sqliteTable(
  'intraday_stocks_table',
  {
    date: text({ length: 10 }).notNull(),
    time: integer().notNull(),
    symbol: text({ length: 10 }).notNull(),
    open: real().notNull(),
    high: real().notNull(),
    low: real().notNull(),
    close: real().notNull(),
    volume: integer().notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.date, table.time, table.symbol],
    }),
  ],
)

export type DailyStocksRow = InferSelectModel<typeof dailyStocksTable>
export type IntradayStocksRow = InferSelectModel<typeof intradayStocksTable>
