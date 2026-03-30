import { v } from 'convex/values'
import type { MutationCtx, QueryCtx } from './_generated/server'
import { mutation, query } from './_generated/server'

const priceLineValidator = v.object({
  id: v.string(),
  price: v.number(),
  color: v.string(),
  lineWidth: v.number(),
  lineStyle: v.number(),
})

async function getAuthenticatedUserSubject(ctx: QueryCtx | MutationCtx) {
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
  args: {
    symbol: v.string(),
  },
  handler: async (ctx, args) => {
    const userSubject = await getAuthenticatedUserSubject(ctx)
    const symbol = normalizeSymbol(args.symbol)
    const doc = await ctx.db
      .query('userDrawings')
      .withIndex('by_userSubject_and_symbol', (q) =>
        q.eq('userSubject', userSubject).eq('symbol', symbol),
      )
      .unique()

    return doc?.priceLines ?? []
  },
})

export const saveForSymbol = mutation({
  args: {
    symbol: v.string(),
    priceLines: v.array(priceLineValidator),
  },
  handler: async (ctx, args) => {
    const userSubject = await getAuthenticatedUserSubject(ctx)
    const symbol = normalizeSymbol(args.symbol)
    const priceLines = args.priceLines.slice(0, 250)
    const existing = await ctx.db
      .query('userDrawings')
      .withIndex('by_userSubject_and_symbol', (q) =>
        q.eq('userSubject', userSubject).eq('symbol', symbol),
      )
      .unique()

    const value = {
      userSubject,
      symbol,
      priceLines,
      updatedAt: Date.now(),
    }

    if (existing) {
      await ctx.db.patch(existing._id, value)
      return existing._id
    }

    return await ctx.db.insert('userDrawings', value)
  },
})
