import { db } from '$lib/server/db';
import { and, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { intradayStocksTable } from '$lib/server/db/schema';

export const load: PageServerLoad = async ({ params }) => {
  const { symbol, date } = params;

  const availableDatesPromise = db
    .selectDistinct({ date: intradayStocksTable.date })
    .from(intradayStocksTable)
    .where(eq(intradayStocksTable.symbol, symbol))
    .orderBy(intradayStocksTable.date);

  const intradayData = await db.query.intradayStocksTable.findMany({
    where: and(eq(intradayStocksTable.symbol, symbol), eq(intradayStocksTable.date, date)),
    orderBy: intradayStocksTable.time,
  });

  const availableDates = await availableDatesPromise;

  return {
    symbol,
    date,
    availableDates: availableDates.map((row) => row.date),
    intradayData,
  };
};
