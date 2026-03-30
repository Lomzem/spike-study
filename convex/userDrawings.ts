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

const MAX_PRICE_LINES = 250

async function getAuthenticatedIdentity(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) {
    throw new Error('Unauthorized')
  }
  return {
    tokenIdentifier: identity.tokenIdentifier,
    subject: identity.subject,
  }
}

function normalizeSymbol(symbol: string) {
  return symbol.trim().toUpperCase()
}

export const getForSymbol = query({
  args: {
    symbol: v.string(),
  },
  handler: async (ctx, args) => {
    const { tokenIdentifier, subject } = await getAuthenticatedIdentity(ctx)
    const symbol = normalizeSymbol(args.symbol)
    const priceLines = await ctx.db
      .query('priceLines')
      .withIndex('by_userTokenIdentifier_and_symbol', (q) =>
        q.eq('userTokenIdentifier', tokenIdentifier).eq('symbol', symbol),
      )
      .collect()

    if (priceLines.length === 0) {
      const legacyDrawing = (await ctx.db.query('userDrawings').collect()).find(
        (drawing) =>
          drawing.symbol === symbol && drawing.userSubject === subject,
      )

      if (legacyDrawing?.priceLines) {
        return legacyDrawing.priceLines
      }
    }

    return priceLines
      .sort((left, right) => left._creationTime - right._creationTime)
      .map((priceLine) => ({
        id: priceLine.lineId,
        price: priceLine.price,
        color: priceLine.color,
        lineWidth: priceLine.lineWidth,
        lineStyle: priceLine.lineStyle,
      }))
  },
})

export const saveForSymbol = mutation({
  args: {
    symbol: v.string(),
    priceLines: v.array(priceLineValidator),
  },
  handler: async (ctx, args) => {
    const { tokenIdentifier, subject } = await getAuthenticatedIdentity(ctx)
    const symbol = normalizeSymbol(args.symbol)

    if (args.priceLines.length > MAX_PRICE_LINES) {
      throw new Error(`Too many price lines. Maximum is ${MAX_PRICE_LINES}.`)
    }

    const [drawingDoc, existingPriceLines] = await Promise.all([
      ctx.db
        .query('userDrawings')
        .withIndex('by_userTokenIdentifier_and_symbol', (q) =>
          q.eq('userTokenIdentifier', tokenIdentifier).eq('symbol', symbol),
        )
        .unique(),
      ctx.db
        .query('priceLines')
        .withIndex('by_userTokenIdentifier_and_symbol', (q) =>
          q.eq('userTokenIdentifier', tokenIdentifier).eq('symbol', symbol),
        )
        .collect(),
    ])

    const resolvedDrawingDoc =
      drawingDoc ??
      (await ctx.db.query('userDrawings').collect()).find(
        (drawing) =>
          drawing.symbol === symbol && drawing.userSubject === subject,
      )

    const updatedAt = Date.now()

    if (resolvedDrawingDoc) {
      await ctx.db.patch(resolvedDrawingDoc._id, {
        userTokenIdentifier: tokenIdentifier,
        updatedAt,
        priceLines: undefined,
      })
    } else {
      await ctx.db.insert('userDrawings', {
        userTokenIdentifier: tokenIdentifier,
        symbol,
        updatedAt,
      })
    }

    const existingByLineId = new Map(
      existingPriceLines.map((priceLine) => [priceLine.lineId, priceLine]),
    )
    const nextLineIds = new Set(
      args.priceLines.map((priceLine) => priceLine.id),
    )

    for (const priceLine of existingPriceLines) {
      if (!nextLineIds.has(priceLine.lineId)) {
        await ctx.db.delete(priceLine._id)
      }
    }

    for (const priceLine of args.priceLines) {
      const existingPriceLine = existingByLineId.get(priceLine.id)
      const value = {
        lineId: priceLine.id,
        userTokenIdentifier: tokenIdentifier,
        symbol,
        price: priceLine.price,
        color: priceLine.color,
        lineWidth: priceLine.lineWidth,
        lineStyle: priceLine.lineStyle,
        updatedAt,
      }

      if (existingPriceLine) {
        await ctx.db.patch(existingPriceLine._id, value)
      } else {
        await ctx.db.insert('priceLines', value)
      }
    }
  },
})
