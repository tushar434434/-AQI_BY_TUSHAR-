const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

let dbPromise = null;

const getDb = async () => {
  if (!dbPromise) {
    dbPromise = open({
      filename: './database.sqlite',
      driver: sqlite3.Database
    });
  }
  return dbPromise;
};

module.exports = {
  getDb,
  query: async (text, params) => {
    const db = await getDb();
    
    // SQLite doesn't use $1, $2, it uses ? for prepared statements in the generic case
    // We can replace $1 with ?
    let sqlQuery = text;
    if (params && params.length > 0) {
      for (let i = 1; i <= params.length; i++) {
        sqlQuery = sqlQuery.replace(`$${i}`, '?');
      }
    }
    
    // Remove "RETURNING id" which is handled differently in sqlite
    const returningRegex = /\s*RETURNING\s+id/i;
    const isReturning = returningRegex.test(sqlQuery);
    if (isReturning) {
        sqlQuery = sqlQuery.replace(returningRegex, '');
    }

    try {
      // If it's an INSERT/UPDATE/DELETE (checking roughly)
      if (/^\s*(INSERT|UPDATE|DELETE)/i.test(sqlQuery)) {
          const result = await db.run(sqlQuery, params);
          if (isReturning) {
              return { rows: [{ id: result.lastID }] };
          }
          return { rows: [] };
      } else {
          // It's a SELECT
          const rows = await db.all(sqlQuery, params);
          return { rows: rows || [] };
      }
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  },
};
