import db from '~/market-data/db'

/**
 * Backfills the `gap` column in daily stock records using the most recent prior close.
 *
 * Updates rows in `daily_stocks_table` where `gap` is null and `open` is present by setting
 * `gap` to (current.open / previous.close - 1) using the latest prior row for the same symbol
 * with a non-null, non-zero `close`. Logs the number of rows affected; on error logs the failure
 * and exits the process with code 1.
 */
async function main() {
  try {
    const result = await db.run(`
    UPDATE daily_stocks_table AS current
    SET gap = (
      SELECT (current.open / previous.close - 1)
      FROM daily_stocks_table AS previous
      WHERE previous.symbol = current.symbol
        AND previous.date < current.date
        AND previous.close IS NOT NULL
        AND previous.close != 0
      ORDER BY previous.date DESC
      LIMIT 1
    )
    WHERE gap IS NULL
    AND current.open IS NOT NULL;
  `)
    console.log(`Backfill complete. Rows affected: ${result.rowsAffected}`)
  } catch (err) {
    console.error('Failed to backfill gaps:', err)
    process.exit(1)
  }
}

main()