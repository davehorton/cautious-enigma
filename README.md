# cautious-enigma

## Testing
**WARNING: This test will drop the database specified in the config.**

1. Update `config/default.json` or create a MySQL user and database with the names provided in the config.
2. `npm start`: start the app normally
3. `npm test`: run the test (in another terminal)

This will:

1. Drop the database specified in `config/default.json` (if it exists)
2. Create the database and build the schema in `db/schema.sql`
3. Use [tape](https://www.npmjs.com/package/tape) to run automated tests on all of the API endpoints
4. Drop the database again

**Note:** If you would the database schema to be build and NOT destroyed at the end of the test, comment out the `Drop Database` section at the bottom of `test/index.js`.
