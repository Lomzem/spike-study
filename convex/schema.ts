import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export const schema = defineSchema({
  userDrawings: defineTable({
    clerkUserId: v.string(),
    symbol: v.string(),
    updatedAt: v.number(),
  }).index('by_clerkUserId_and_symbol', ['clerkUserId', 'symbol']),
  priceLines: defineTable({
    userDrawingId: v.id('userDrawings'),
    lineId: v.string(),
    price: v.number(),
    color: v.string(),
    lineWidth: v.number(),
    lineStyle: v.union(
      v.literal(0),
      v.literal(1),
      v.literal(2),
      v.literal(3),
      v.literal(4),
    ),
    sortOrder: v.number(),
  })
    .index('by_userDrawingId', ['userDrawingId'])
    .index('by_userDrawingId_and_lineId', ['userDrawingId', 'lineId']),
})

export default schema
