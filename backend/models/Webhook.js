const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Webhook', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false },
  url: { type: DataTypes.STRING, allowNull: false },
  secret: { type: DataTypes.STRING, defaultValue: null },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  last_triggered: { type: DataTypes.DATE, defaultValue: null },
}, { timestamps: true, underscored: true });
