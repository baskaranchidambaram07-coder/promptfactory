const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Prompt', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  text: { type: DataTypes.TEXT, allowNull: false },
  negative_prompt: { type: DataTypes.TEXT, defaultValue: null },
  category: {
    type: DataTypes.ENUM('travel', 'music', 'invite', 'love'),
    allowNull: false,
    defaultValue: 'travel',
  },
  tags: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
  thumbnail_url: { type: DataTypes.STRING, defaultValue: null },
  images: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
  click_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  created_by: { type: DataTypes.UUID, allowNull: true },
}, { timestamps: true, underscored: true });
