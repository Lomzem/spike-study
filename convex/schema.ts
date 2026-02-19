import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'
import { typedV } from 'convex-helpers/validators'

export const schema = defineSchema({
  dailyStocks: defineTable({
    date: v.string(),
    symbol: v.string(),
    open: v.number(),
    high: v.number(),
    low: v.number(),
    close: v.number(),
    volume: v.number(),
    trades: v.optional(v.number()),
    gap: v.optional(v.number()), // may not have stored previous day
    range: v.number(),
    change: v.number(),
    needsBackfill: v.boolean(),
  })
    .index('by_date_symbol', ['date', 'symbol'])
    .index('by_date_needsBackfill', ['date', 'needsBackfill']),
  posts: defineTable({
    id: v.string(),
    title: v.string(),
    body: v.string(),
  }).index('id', ['id']),
})

export default schema

export const vv = typedV(schema)
