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
  userDrawings: defineTable({
    userSubject: v.string(),
    symbol: v.string(),
    priceLines: v.array(
      v.object({
        id: v.string(),
        price: v.number(),
        color: v.string(),
        lineWidth: v.number(),
        lineStyle: v.number(),
      }),
    ),
    updatedAt: v.number(),
  }).index('by_userSubject_and_symbol', ['userSubject', 'symbol']),
})

export default schema

export const vv = typedV(schema)
