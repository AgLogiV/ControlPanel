module.exports = (sequelize, DataTypes) => {
  const Backup = sequelize.define('Backup', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    size: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('completed', 'failed', 'in_progress'),
      defaultValue: 'in_progress',
    },
    isAutomatic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    serverId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  });

  // Define associations
  Backup.associate = (models) => {
    Backup.belongsTo(models.Server, {
      foreignKey: 'serverId',
      as: 'server',
    });
  };

  return Backup;
}; 