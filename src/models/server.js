module.exports = (sequelize, DataTypes) => {
  const Server = sequelize.define('Server', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [3, 50],
      },
    },
    gameType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('running', 'stopped', 'starting', 'stopping', 'error'),
      defaultValue: 'stopped',
    },
    port: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    memory: {
      type: DataTypes.INTEGER, // Memory in MB
      allowNull: false,
      defaultValue: 1024,
    },
    cpu: {
      type: DataTypes.INTEGER, // CPU percentage limit
      allowNull: false,
      defaultValue: 100,
    },
    disk: {
      type: DataTypes.INTEGER, // Disk space in MB
      allowNull: false,
      defaultValue: 10240,
    },
    containerId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastStarted: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastStopped: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    autoRestart: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    backupEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    backupSchedule: {
      type: DataTypes.STRING,
      defaultValue: '0 0 * * *', // Daily at midnight (cron format)
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  });

  // Define associations
  Server.associate = (models) => {
    Server.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
    
    Server.hasMany(models.Backup, {
      foreignKey: 'serverId',
      as: 'backups',
    });
  };

  return Server;
}; 