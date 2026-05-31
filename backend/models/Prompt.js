const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Prompt', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  text: { type: DataTypes.TEXT, allowNull: false },
  category: { type: DataTypes.STRING, defaultValue: 'general' },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  created_by: { type: DataTypes.UUID, allowNull: true },
}, { timestamps: true, underscored: true });
