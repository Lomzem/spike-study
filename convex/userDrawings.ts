import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import type { MutationCtx, QueryCtx } from './_generated/server'

const lineWidthValidator = v.union(
  v.literal(1),
  v.literal(2),
  v.literal(3),
  v.literal(4),
)
const lineStyleValidator = v.union(
  v.literal(0),
  v.literal(1),
  v.literal(2),
  v.literal(3),
  v.literal(4),
)
const timeValidator = v.union(
  v.number(),
  v.string(),
  v.object({ year: v.number(), month: v.number(), day: v.number() }),
)
const anchorValidator = v.object({
  time: timeValidator,
  price: v.number(),
})
const fibLevelValidator = v.object({
  id: v.string(),
  value: v.number(),
  color: v.string(),
  visible: v.boolean(),
})

const savedDrawingValidator = v.union(
  v.object({
    id: v.string(),
    type: v.literal('horizontal-line'),
    anchors: v.array(anchorValidator),
    color: v.string(),
    lineWidth: lineWidthValidator,
    lineStyle: lineStyleValidator,
    extendLeft: v.boolean(),
    extendRight: v.boolean(),
  }),
  v.object({
    id: v.string(),
    type: v.literal('diagonal-line'),
    anchors: v.array(anchorValidator),
    color: v.string(),
    lineWidth: lineWidthValidator,
    lineStyle: lineStyleValidator,
    extendLeft: v.boolean(),
    extendRight: v.boolean(),
  }),
  v.object({
    id: v.string(),
    type: v.literal('fib-retracement'),
    anchors: v.array(anchorValidator),
    color: v.string(),
    lineWidth: lineWidthValidator,
    lineStyle: lineStyleValidator,
    extendLeft: v.boolean(),
    extendRight: v.boolean(),
    showPrices: v.boolean(),
    showPercentages: v.boolean(),
    levels: v.array(fibLevelValidator),
  }),
)

const lineDefaultsValidator = v.object({
  color: v.string(),
  lineWidth: lineWidthValidator,
  lineStyle: lineStyleValidator,
  extendLeft: v.boolean(),
  extendRight: v.boolean(),
})

const fibDefaultsValidator = v.object({
  color: v.string(),
  lineWidth: lineWidthValidator,
  lineStyle: lineStyleValidator,
  extendLeft: v.boolean(),
  extendRight: v.boolean(),
  showPrices: v.boolean(),
  showPercentages: v.boolean(),
  levels: v.array(fibLevelValidator),
})

const drawingDefaultsValidator = v.object({
  horizontalLine: lineDefaultsValidator,
  diagonalLine: lineDefaultsValidator,
  fibRetracement: fibDefaultsValidator,
})

async function getAuthenticatedIdentity(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) {
    throw new Error('Unauthorized')
  }

  return identity.subject
}

function normalizeSymbol(symbol: string) {
  return symbol.trim().toUpperCase()
}

export const getForSymbol = query({
  args: { symbol: v.string() },
  returns: v.union(v.null(), v.array(savedDrawingValidator)),
  handler: async (ctx, args) => {
    const clerkUserId = await getAuthenticatedIdentity(ctx)
    const symbol = normalizeSymbol(args.symbol)
    const drawing = await ctx.db
      .query('userDrawings')
      .withIndex('by_clerkUserId_and_symbol', (q) =>
        q.eq('clerkUserId', clerkUserId).eq('symbol', symbol),
      )
      .unique()

    return drawing?.drawings ?? null
  },
})

export const saveForSymbol = mutation({
  args: {
    symbol: v.string(),
    drawings: v.array(savedDrawingValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const clerkUserId = await getAuthenticatedIdentity(ctx)
    const symbol = normalizeSymbol(args.symbol)
    const existing = await ctx.db
      .query('userDrawings')
      .withIndex('by_clerkUserId_and_symbol', (q) =>
        q.eq('clerkUserId', clerkUserId).eq('symbol', symbol),
      )
      .unique()

    const value = {
      clerkUserId,
      symbol,
      drawings: args.drawings,
      updatedAt: Date.now(),
    }

    if (existing) {
      await ctx.db.patch(existing._id, value)
    } else {
      await ctx.db.insert('userDrawings', value)
    }

    return null
  },
})

export const getDefaults = query({
  args: {},
  returns: v.union(v.null(), drawingDefaultsValidator),
  handler: async (ctx) => {
    const clerkUserId = await getAuthenticatedIdentity(ctx)
    const defaults = await ctx.db
      .query('userDrawingDefaults')
      .withIndex('by_clerkUserId', (q) => q.eq('clerkUserId', clerkUserId))
      .unique()

    if (!defaults) {
      return null
    }

    return {
      horizontalLine: defaults.horizontalLine,
      diagonalLine: defaults.diagonalLine,
      fibRetracement: defaults.fibRetracement,
    }
  },
})

export const saveDefaults = mutation({
  args: {
    defaults: drawingDefaultsValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const clerkUserId = await getAuthenticatedIdentity(ctx)
    const existing = await ctx.db
      .query('userDrawingDefaults')
      .withIndex('by_clerkUserId', (q) => q.eq('clerkUserId', clerkUserId))
      .unique()

    const value = {
      clerkUserId,
      horizontalLine: args.defaults.horizontalLine,
      diagonalLine: args.defaults.diagonalLine,
      fibRetracement: args.defaults.fibRetracement,
      updatedAt: Date.now(),
    }

    if (existing) {
      await ctx.db.patch(existing._id, value)
    } else {
      await ctx.db.insert('userDrawingDefaults', value)
    }

    return null
  },
})
