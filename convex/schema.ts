import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'
import { typedV } from 'convex-helpers/validators'

const schema = defineSchema({
  dailyStocks: defineTable({
    date: v.string(),
    symbol: v.string(),
    open: v.number(),
    high: v.number(),
    low: v.number(),
    close: v.number(),
    volume: v.number(),
    trades: v.optional(v.number()),
  }),
  posts: defineTable({
    id: v.string(),
    title: v.string(),
    body: v.string(),
  }).index('id', ['id']),
})
export default schema

export const vv = typedV(schema)
