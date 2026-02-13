import {
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core'

export const dailyStocksTable = sqliteTable(
  'daily_stocks_table',
  {
    date: text({ length: 10 }).notNull(),
    symbol: text({ length: 5 }).notNull(),
    open: real().notNull(),
    high: real().notNull(),
    low: real().notNull(),
    close: real().notNull(),
    volume: integer().notNull(),
    trades: integer(),
    gap: real(),
    range: real().notNull(),
    change: real().notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.date, table.symbol],
    }),
  ],
)
