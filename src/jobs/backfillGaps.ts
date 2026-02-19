import db from '~/market-data/db'

async function main() {
  try {
    const result = await db.run(`
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
    console.log(`Backfill complete. Rows affected: ${result.rowsAffected}`)
  } catch (err) {
    console.error('Failed to backfill gaps:', err)
    process.exit(1)
  }
}

main()
