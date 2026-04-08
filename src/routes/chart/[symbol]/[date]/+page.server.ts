import { db } from '$lib/server/db';
import { and, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { intradayStocksTable } from '$lib/server/db/schema';

export const load: PageServerLoad = async ({ params }) => {
	const { symbol, date } = params;

	const intradayData = await db.query.intradayStocksTable.findMany({
		where: and(eq(intradayStocksTable.symbol, symbol), eq(intradayStocksTable.date, date))
	});

	return {
		symbol,
		date,
		intradayData
	};
};
