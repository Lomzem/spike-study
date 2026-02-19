import db from '~/market-data/db'

/**
 * Backfills the `gap` column for daily stock rows by computing each day's percentage change from the most recent previous close for the same symbol.
 *
 * Only rows where `gap` is currently null are updated; for each row the value set is (current.open / previous.close - 1) using the most recent prior trading day for that symbol.
 */
async function main() {
  await db.run(`
    UPDATE daily_stocks_table AS current
    SET gap = (
      SELECT (current.open / previous.close - 1)
      FROM daily_stocks_table AS previous
      WHERE previous.symbol = current.symbol
        AND previous.date < current.date
      ORDER BY previous.date DESC
      LIMIT 1
    )
    WHERE gap IS NULL;
`)
}

main()