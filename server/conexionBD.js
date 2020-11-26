// Proper way to initialize and share the Database object
// Loading and initializing the library:
const pgp = require('pg-promise')({
    // Initialization Options
});

// Preparing the connection details:
const conexionPosgres = 'postgres://pg:Asdf1234$@localhost:5433/veterinarias';

// Creating a new database instance from the connection details:
const db = pgp(conexionPosgres);

// Exporting the database object for shared use:
module.exports = db;
