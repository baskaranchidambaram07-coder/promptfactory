const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Request', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id: { type: DataTypes.UUID, allowNull: false },
  image_url: { type: DataTypes.STRING, allowNull: false },
  prompt_text: { type: DataTypes.TEXT, allowNull: false },
  output_url: { type: DataTypes.STRING, defaultValue: null },
  status: { type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'), defaultValue: 'pending' },
  webhook_url: { type: DataTypes.STRING, defaultValue: null },
  ai_response: { type: DataTypes.JSONB, defaultValue: null },
}, { timestamps: true, underscored: true });
