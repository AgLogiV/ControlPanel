const Docker = require('dockerode');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const { Script } = require('../models');

// Initialize Docker client
const docker = new Docker({
  socketPath: process.env.DOCKER_SOCKET || '/var/run/docker.sock',
});

// Get container name for a server
const getContainerName = (server) => {
  return `gameserver-${server.id}`;
};

// Get container config for a server
const getContainerConfig = async (server) => {
  try {
    // Get Dockerfile script for this server
    const dockerfileScript = await Script.findOne({
      where: {
        serverId: server.id,
        type: 'dockerfile',
      },
    });
    
    // Get startup script for this server
    const startupScript = await Script.findOne({
      where: {
        serverId: server.id,
        type: 'startup',
      },
    });
    
    // Get config script for this server
    const configScript = await Script.findOne({
      where: {
        serverId: server.id,
        type: 'config',
      },
    });
    
    // Create server directory if it doesn't exist
    const serverDir = path.join(process.cwd(), 'data', 'servers', server.id);
    if (!fs.existsSync(serverDir)) {
      fs.mkdirSync(serverDir, { recursive: true });
    }
    
    // Write Dockerfile if it exists
    if (dockerfileScript) {
      fs.writeFileSync(path.join(serverDir, 'Dockerfile'), dockerfileScript.content);
    }
    
    // Write startup script if it exists
    if (startupScript) {
      const startupPath = path.join(serverDir, 'start.sh');
      fs.writeFileSync(startupPath, startupScript.content);
      fs.chmodSync(startupPath, '755');
    }
    
    // Write config file if it exists
    if (configScript) {
      fs.writeFileSync(path.join(serverDir, 'server.config'), configScript.content);
    }
    
    // Build container config
    const containerConfig = {
      Image: `gameserver-${server.id}`,
      name: getContainerName(server),
      Hostname: `gameserver-${server.id}`,
      ExposedPorts: {
        [`${server.port}/tcp`]: {},
      },
      HostConfig: {
        PortBindings: {
          [`${server.port}/tcp`]: [
            {
              HostPort: `${server.port}`,
            },
          ],
        },
        Binds: [
          `${serverDir}:/data`,
        ],
        Memory: server.memory * 1024 * 1024, // Convert MB to bytes
        MemorySwap: server.memory * 1024 * 1024 * 2, // Double the memory for swap
        CpuPercent: server.cpu,
        RestartPolicy: {
          Name: server.autoRestart ? 'unless-stopped' : 'no',
        },
      },
      Env: [
        `SERVER_PORT=${server.port}`,
        `SERVER_MEMORY=${server.memory}`,
        `SERVER_CPU=${server.cpu}`,
        `GAME_TYPE=${server.gameType}`,
      ],
      Tty: true,
    };
    
    return {
      containerConfig,
      serverDir,
    };
  } catch (error) {
    logger.error(`Error getting container config: ${error.message}`);
    throw error;
  }
};

// Build Docker image for a server
const buildImage = async (server, serverDir) => {
  try {
    logger.info(`Building Docker image for server ${server.id}`);
    
    // Create a tar archive of the server directory
    const tarStream = await docker.buildImage({
      context: serverDir,
      src: ['Dockerfile', 'start.sh', 'server.config'],
    }, {
      t: `gameserver-${server.id}`,
    });
    
    // Wait for the build to complete
    await new Promise((resolve, reject) => {
      docker.modem.followProgress(
        tarStream,
        (err, res) => err ? reject(err) : resolve(res),
        (progress) => {
          logger.debug(`Build progress: ${JSON.stringify(progress)}`);
        }
      );
    });
    
    logger.info(`Docker image built for server ${server.id}`);
  } catch (error) {
    logger.error(`Error building Docker image: ${error.message}`);
    throw error;
  }
};

// Start a server
const startServer = async (server) => {
  try {
    logger.info(`Starting server ${server.id}`);
    
    // Get container config
    const { containerConfig, serverDir } = await getContainerConfig(server);
    
    // Build Docker image
    await buildImage(server, serverDir);
    
    // Create container
    const container = await docker.createContainer(containerConfig);
    
    // Start container
    await container.start();
    
    logger.info(`Server ${server.id} started with container ID ${container.id}`);
    
    return container.id;
  } catch (error) {
    logger.error(`Error starting server: ${error.message}`);
    throw error;
  }
};

// Stop a container
const stopContainer = async (containerId) => {
  try {
    logger.info(`Stopping container ${containerId}`);
    
    const container = docker.getContainer(containerId);
    
    // Check if container exists
    try {
      await container.inspect();
    } catch (error) {
      logger.warn(`Container ${containerId} not found`);
      return;
    }
    
    // Stop container
    await container.stop({ t: 10 });
    
    logger.info(`Container ${containerId} stopped`);
  } catch (error) {
    logger.error(`Error stopping container: ${error.message}`);
    throw error;
  }
};

// Remove a container
const removeContainer = async (containerId) => {
  try {
    logger.info(`Removing container ${containerId}`);
    
    const container = docker.getContainer(containerId);
    
    // Check if container exists
    try {
      await container.inspect();
    } catch (error) {
      logger.warn(`Container ${containerId} not found`);
      return;
    }
    
    // Remove container
    await container.remove({ force: true });
    
    logger.info(`Container ${containerId} removed`);
  } catch (error) {
    logger.error(`Error removing container: ${error.message}`);
    throw error;
  }
};

// Get container stats
const getContainerStats = async (containerId) => {
  try {
    const container = docker.getContainer(containerId);
    
    // Get container stats
    const stats = await container.stats({ stream: false });
    
    // Calculate CPU usage
    const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
    const systemCpuDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
    const cpuCount = stats.cpu_stats.cpu_usage.percpu_usage ? stats.cpu_stats.cpu_usage.percpu_usage.length : 1;
    const cpuUsage = (cpuDelta / systemCpuDelta) * cpuCount * 100;
    
    // Calculate memory usage
    const memoryUsage = stats.memory_stats.usage / (1024 * 1024); // Convert to MB
    const memoryLimit = stats.memory_stats.limit / (1024 * 1024); // Convert to MB
    const memoryPercent = (memoryUsage / memoryLimit) * 100;
    
    // Calculate network usage
    let networkRx = 0;
    let networkTx = 0;
    
    if (stats.networks) {
      Object.keys(stats.networks).forEach((iface) => {
        networkRx += stats.networks[iface].rx_bytes;
        networkTx += stats.networks[iface].tx_bytes;
      });
    }
    
    // Convert to MB
    networkRx = networkRx / (1024 * 1024);
    networkTx = networkTx / (1024 * 1024);
    
    return {
      cpu: {
        usage: cpuUsage.toFixed(2),
        percent: cpuUsage.toFixed(2),
      },
      memory: {
        usage: memoryUsage.toFixed(2),
        limit: memoryLimit.toFixed(2),
        percent: memoryPercent.toFixed(2),
      },
      network: {
        rx: networkRx.toFixed(2),
        tx: networkTx.toFixed(2),
      },
      timestamp: new Date(),
    };
  } catch (error) {
    logger.error(`Error getting container stats: ${error.message}`);
    throw error;
  }
};

module.exports = {
  startServer,
  stopContainer,
  removeContainer,
  getContainerStats,
}; 