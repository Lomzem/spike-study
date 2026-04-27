import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export const schema = defineSchema({
  userDrawings: defineTable({
    clerkUserId: v.string(),
    symbol: v.string(),
    drawings: v.array(
      v.union(
        v.object({
          id: v.string(),
          type: v.literal('horizontal-line'),
          anchors: v.array(
            v.object({
              time: v.union(
                v.number(),
                v.string(),
                v.object({
                  year: v.number(),
                  month: v.number(),
                  day: v.number(),
                }),
              ),
              price: v.number(),
            }),
          ),
          color: v.string(),
          lineWidth: v.union(
            v.literal(1),
            v.literal(2),
            v.literal(3),
            v.literal(4),
          ),
          lineStyle: v.union(
            v.literal(0),
            v.literal(1),
            v.literal(2),
            v.literal(3),
            v.literal(4),
          ),
          extendLeft: v.boolean(),
          extendRight: v.boolean(),
        }),
        v.object({
          id: v.string(),
          type: v.literal('diagonal-line'),
          anchors: v.array(
            v.object({
              time: v.union(
                v.number(),
                v.string(),
                v.object({
                  year: v.number(),
                  month: v.number(),
                  day: v.number(),
                }),
              ),
              price: v.number(),
            }),
          ),
          color: v.string(),
          lineWidth: v.union(
            v.literal(1),
            v.literal(2),
            v.literal(3),
            v.literal(4),
          ),
          lineStyle: v.union(
            v.literal(0),
            v.literal(1),
            v.literal(2),
            v.literal(3),
            v.literal(4),
          ),
          extendLeft: v.boolean(),
          extendRight: v.boolean(),
        }),
        v.object({
          id: v.string(),
          type: v.literal('fib-retracement'),
          anchors: v.array(
            v.object({
              time: v.union(
                v.number(),
                v.string(),
                v.object({
                  year: v.number(),
                  month: v.number(),
                  day: v.number(),
                }),
              ),
              price: v.number(),
            }),
          ),
          color: v.string(),
          lineWidth: v.union(
            v.literal(1),
            v.literal(2),
            v.literal(3),
            v.literal(4),
          ),
          lineStyle: v.union(
            v.literal(0),
            v.literal(1),
            v.literal(2),
            v.literal(3),
            v.literal(4),
          ),
          extendLeft: v.boolean(),
          extendRight: v.boolean(),
          showPrices: v.boolean(),
          showPercentages: v.boolean(),
          levels: v.array(
            v.object({
              id: v.string(),
              value: v.number(),
              color: v.string(),
              visible: v.boolean(),
            }),
          ),
        }),
      ),
    ),
    updatedAt: v.number(),
  }).index('by_clerkUserId_and_symbol', ['clerkUserId', 'symbol']),
  userDrawingDefaults: defineTable({
    clerkUserId: v.string(),
    horizontalLine: v.object({
      color: v.string(),
      lineWidth: v.union(
        v.literal(1),
        v.literal(2),
        v.literal(3),
        v.literal(4),
      ),
      lineStyle: v.union(
        v.literal(0),
        v.literal(1),
        v.literal(2),
        v.literal(3),
        v.literal(4),
      ),
      extendLeft: v.boolean(),
      extendRight: v.boolean(),
    }),
    diagonalLine: v.object({
      color: v.string(),
      lineWidth: v.union(
        v.literal(1),
        v.literal(2),
        v.literal(3),
        v.literal(4),
      ),
      lineStyle: v.union(
        v.literal(0),
        v.literal(1),
        v.literal(2),
        v.literal(3),
        v.literal(4),
      ),
      extendLeft: v.boolean(),
      extendRight: v.boolean(),
    }),
    fibRetracement: v.object({
      color: v.string(),
      lineWidth: v.union(
        v.literal(1),
        v.literal(2),
        v.literal(3),
        v.literal(4),
      ),
      lineStyle: v.union(
        v.literal(0),
        v.literal(1),
        v.literal(2),
        v.literal(3),
        v.literal(4),
      ),
      extendLeft: v.boolean(),
      extendRight: v.boolean(),
      showPrices: v.boolean(),
      showPercentages: v.boolean(),
      levels: v.array(
        v.object({
          id: v.string(),
          value: v.number(),
          color: v.string(),
          visible: v.boolean(),
        }),
      ),
    }),
    updatedAt: v.number(),
  }).index('by_clerkUserId', ['clerkUserId']),
})

export default schema
