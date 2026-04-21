import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import type { MutationCtx, QueryCtx } from './_generated/server'

const priceLineValidator = v.object({
  id: v.string(),
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
})

const MAX_PRICE_LINES = 250

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

function isValidLineWidth(lineWidth: number) {
  return (
    Number.isFinite(lineWidth) && Number.isInteger(lineWidth) && lineWidth > 0
  )
}

function isValidPrice(price: number) {
  return Number.isFinite(price)
}

function validatePriceLines(
  priceLines: Array<{
    id: string
    price: number
    color: string
    lineWidth: number
    lineStyle: 0 | 1 | 2 | 3 | 4
  }>,
) {
  const seenLineIds = new Set<string>()

  for (const priceLine of priceLines) {
    if (seenLineIds.has(priceLine.id)) {
      throw new Error(`Duplicate price line id: ${priceLine.id}`)
    }
    seenLineIds.add(priceLine.id)

    if (!isValidPrice(priceLine.price)) {
      throw new Error(`Invalid price for line ${priceLine.id}`)
    }

    if (!isValidLineWidth(priceLine.lineWidth)) {
      throw new Error(`Invalid line width for line ${priceLine.id}`)
    }
  }
}

const savedPriceLineArrayValidator = v.array(priceLineValidator)

function toSavedPriceLine(priceLine: {
  lineId: string
  price: number
  color: string
  lineWidth: number
  lineStyle: 0 | 1 | 2 | 3 | 4
}) {
  return {
    id: priceLine.lineId,
    price: priceLine.price,
    color: priceLine.color,
    lineWidth: priceLine.lineWidth,
    lineStyle: priceLine.lineStyle,
  }
}

async function getOrCreateUserDrawing(
  ctx: MutationCtx,
  clerkUserId: string,
  symbol: string,
) {
  const existing = await ctx.db
    .query('userDrawings')
    .withIndex('by_clerkUserId_and_symbol', (q) =>
      q.eq('clerkUserId', clerkUserId).eq('symbol', symbol),
    )
    .unique()

  if (existing) {
    return existing
  }

  const now = Date.now()
  const userDrawingId = await ctx.db.insert('userDrawings', {
    clerkUserId,
    symbol,
    updatedAt: now,
  })

  const created = await ctx.db.get(userDrawingId)

  if (!created) {
    throw new Error('Failed to create drawing state')
  }

  return created
}

export const getForSymbol = query({
  args: {
    symbol: v.string(),
  },
  returns: v.union(v.null(), savedPriceLineArrayValidator),
  handler: async (ctx, args) => {
    const clerkUserId = await getAuthenticatedIdentity(ctx)
    const symbol = normalizeSymbol(args.symbol)

    const drawing = await ctx.db
      .query('userDrawings')
      .withIndex('by_clerkUserId_and_symbol', (q) =>
        q.eq('clerkUserId', clerkUserId).eq('symbol', symbol),
      )
      .unique()

    if (!drawing) {
      return null
    }

    const priceLines = await ctx.db
      .query('priceLines')
      .withIndex('by_userDrawingId', (q) => q.eq('userDrawingId', drawing._id))
      .collect()

    return priceLines
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map(toSavedPriceLine)
  },
})

export const saveForSymbol = mutation({
  args: {
    symbol: v.string(),
    priceLines: savedPriceLineArrayValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const clerkUserId = await getAuthenticatedIdentity(ctx)
    const symbol = normalizeSymbol(args.symbol)

    if (args.priceLines.length > MAX_PRICE_LINES) {
      throw new Error(`Too many price lines. Maximum is ${MAX_PRICE_LINES}.`)
    }

    validatePriceLines(args.priceLines)

    const drawingDoc = await getOrCreateUserDrawing(ctx, clerkUserId, symbol)
    const existingPriceLines = await ctx.db
      .query('priceLines')
      .withIndex('by_userDrawingId', (q) =>
        q.eq('userDrawingId', drawingDoc._id),
      )
      .collect()

    const updatedAt = Date.now()

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

    for (const [sortOrder, priceLine] of args.priceLines.entries()) {
      const existingPriceLine = existingByLineId.get(priceLine.id)
      const value = {
        userDrawingId: drawingDoc._id,
        lineId: priceLine.id,
        price: priceLine.price,
        color: priceLine.color,
        lineWidth: priceLine.lineWidth,
        lineStyle: priceLine.lineStyle,
        sortOrder,
      }

      if (existingPriceLine) {
        await ctx.db.patch(existingPriceLine._id, value)
      } else {
        await ctx.db.insert('priceLines', value)
      }
    }

    await ctx.db.patch(drawingDoc._id, {
      updatedAt,
    })

    return null
  },
})
