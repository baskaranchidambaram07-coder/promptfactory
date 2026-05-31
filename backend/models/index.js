const { Sequelize } = require('sequelize');

let sequelize;

if (process.env.DB_MODE === 'mock') {
  // SQLite in-memory for testing
  sequelize = new Sequelize('sqlite::memory:', { logging: false });
} else {
  // Supabase PostgreSQL
  const dbConfig = require('../../config/database');
  const env = process.env.NODE_ENV || 'development';
  const config = dbConfig[env];
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

// Import models
const User = require('./User')(sequelize);
const Prompt = require('./Prompt')(sequelize);
const Request = require('./Request')(sequelize);
const Webhook = require('./Webhook')(sequelize);

// Associations
User.hasMany(Request, { foreignKey: 'user_id' });
Request.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Prompt, { foreignKey: 'created_by' });
Prompt.belongsTo(User, { foreignKey: 'created_by' });

User.hasMany(Webhook, { foreignKey: 'user_id' });
Webhook.belongsTo(User, { foreignKey: 'user_id' });

module.exports = { sequelize, User, Prompt, Request, Webhook };
