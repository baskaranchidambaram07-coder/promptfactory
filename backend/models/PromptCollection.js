const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('PromptCollection', {
  PromptID: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  Description: { type: DataTypes.TEXT, allowNull: true },
  FromURL: { type: DataTypes.TEXT, allowNull: true },
  ToURL: { type: DataTypes.TEXT, allowNull: true },
  Categories: { type: DataTypes.STRING, allowNull: true },
  usedcount: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: 'promptcollection', timestamps: true, underscored: true });
