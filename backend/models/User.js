const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('User', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
  password: { type: DataTypes.STRING, allowNull: true },
  google_id: { type: DataTypes.STRING, allowNull: true, unique: true },
  role: { type: DataTypes.ENUM('user', 'admin'), defaultValue: 'user' },
  avatar: { type: DataTypes.STRING, defaultValue: null },
  is_premium: { type: DataTypes.BOOLEAN, defaultValue: false },
  daily_generations_used: { type: DataTypes.INTEGER, defaultValue: 0 },
  daily_reset_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { timestamps: true, underscored: true });
