const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const expressWs = require('express-ws');
const { sequelize } = require('./models');
const logger = require('./utils/logger');
const routes = require('./routes');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
expressWs(app);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api', routes);

// Serve static files for the frontend
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'));
  
  const path = require('path');
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client', 'build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
    },
  });
});

// Start the server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Sync database models
    await sequelize.sync();
    logger.info('Database synchronized successfully');

    // Start listening
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer(); 