import { toDateString } from '../lib/utils';
import type { IntradayStocksTableRow } from '../lib/server/db/schema';
import { db } from '../lib/server/db';
import { intradayStocksTable } from '../lib/server/db/schema';

const MASSIVE_API_KEY = process.env.MASSIVE_API_KEY;
if (!MASSIVE_API_KEY) {
	throw new Error('MASSIVE_API_KEY environment variable not set');
}

const MASSIVE_DAILY_MARKET_SUMMARY_ENDPOINT = new URL('https://api.massive.com/v2/aggs/ticker/');
MASSIVE_DAILY_MARKET_SUMMARY_ENDPOINT.searchParams.set('apiKey', MASSIVE_API_KEY);
MASSIVE_DAILY_MARKET_SUMMARY_ENDPOINT.searchParams.set('adjusted', 'true');

const TIME_MULTIPLIER = 1;
const TIME_FRAME = 'minute';

interface MassiveIntradayResult {
	t: number;
	c: number;
	h: number;
	l: number;
	n?: number;
	o: number;
	v: number;
}

interface MassiveIntradayResponse {
	adjusted: boolean;
	queryCount: number;
	request_id: string;
	resultsCount?: number;
	status: string;
	results?: Array<MassiveIntradayResult>;
}

async function fetchIntradayStock(symbol: string, date: Date) {
	const url = new URL(MASSIVE_DAILY_MARKET_SUMMARY_ENDPOINT);
	const dateString = toDateString(date);

	url.pathname += `${symbol}/range/${TIME_MULTIPLIER}/${TIME_FRAME}/${dateString}/${dateString}`;

	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`API request failed: ${response.status} ${response.statusText}`);
	}

	const data = (await response.json()) as MassiveIntradayResponse;
	return data;
}

async function insertIntradayStock({
	symbol,
	date,
	results
}: {
	symbol: string;
	date: Date;
	results: Array<MassiveIntradayResult>;
}) {
	const renamedResults: Array<IntradayStocksTableRow> = results.map((r) => ({
		symbol,
		date: toDateString(date),
		open: r.o,
		high: r.h,
		low: r.l,
		close: r.c,
		volume: r.v,
		time: r.t
	}));

	const result = await db.insert(intradayStocksTable).values(renamedResults).onConflictDoNothing();

	console.log(result);
}

async function main() {
	const symbol = process.argv[2]?.toUpperCase();
	const targetDateArg = process.argv[3];
	const targetDate = new Date(targetDateArg);

	if (!symbol || Number.isNaN(targetDate.getTime())) {
		console.error('Usage: bun run src/jobs/fetchIntradayStocks.ts <SYMBOL> <YYYY-MM-DD>');
		process.exit(1);
	}

	const data = await fetchIntradayStock(symbol, targetDate);

	if (!data.results || data.resultsCount === 0) {
		console.error(`No results for ${toDateString(targetDate)}`);
		console.error(data);
		return;
	}

	await insertIntradayStock({
		symbol,
		date: targetDate,
		results: data.results
	});

	console.log(
		`Saved ${data.results.length} intraday rows for ${symbol} on ${toDateString(targetDate)}`
	);
}

main().catch((err) => {
	console.error('Fatal error:', err);
	process.exit(1);
});
