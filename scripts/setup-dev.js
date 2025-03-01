#!/usr/bin/env node

/**
 * Development setup script
 * Creates necessary directories and files for development
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Setting up development environment...');

// Create necessary directories
const dirs = [
  'data',
  'data/servers',
  'data/backups',
  'logs'
];

dirs.forEach(dir => {
  const dirPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
});

// Create .env file if it doesn't exist
const envPath = path.join(process.cwd(), '.env');
const envExamplePath = path.join(process.cwd(), '.env.example');

if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  fs.copyFileSync(envExamplePath, envPath);
  console.log(`Created .env file from .env.example`);
}

// Check if MongoDB is installed
try {
  console.log('Checking MongoDB installation...');
  execSync('mongod --version', { stdio: 'ignore' });
  console.log('MongoDB is installed');
} catch (error) {
  console.log('MongoDB is not installed or not in PATH');
  console.log('Please install MongoDB: https://www.mongodb.com/try/download/community');
}

// Check if Docker is installed
try {
  console.log('Checking Docker installation...');
  execSync('docker --version', { stdio: 'ignore' });
  console.log('Docker is installed');
} catch (error) {
  console.log('Docker is not installed or not in PATH');
  console.log('Please install Docker: https://docs.docker.com/get-docker/');
}

console.log('\nDevelopment environment setup complete!');
console.log('\nNext steps:');
console.log('1. Make sure MongoDB is running');
console.log('2. Make sure Docker is running');
console.log('3. Update the .env file with your configuration');
console.log('4. Run "npm install" to install dependencies');
console.log('5. Run "npm run dev" to start the development server'); 