'use strict';

require('dotenv').config();
const express = require('express');
const { ValidationError } = require('sequelize');
const db = require('./src/models');
const routes = require('./src/routes/routes');

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());
app.use('/api', routes);

app.use((err, req, res, next) => {
    console.error(err);

    if (err instanceof ValidationError) {
        return res.status(422).json({
            success: false,
            message: 'Validation failed',
            errors: err.errors.map(e => ({
                field: e.path,
                message: e.message
            }))
        });
    }

    return res.status(500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
});

async function startServer() {
  try {
    await db.sequelize.authenticate();
    console.log('Database connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
}

startServer();