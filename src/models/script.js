module.exports = (sequelize, DataTypes) => {
  const Script = sequelize.define('Script', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('dockerfile', 'config', 'startup', 'custom'),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    language: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'bash',
    },
    gameType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    isTemplate: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    parameters: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    serverId: {
      type: DataTypes.UUID,
      allowNull: true, // Can be null if it's a template
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  });

  // Define associations
  Script.associate = (models) => {
    Script.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
    
    Script.belongsTo(models.Server, {
      foreignKey: 'serverId',
      as: 'server',
    });
  };

  return Script;
}; 