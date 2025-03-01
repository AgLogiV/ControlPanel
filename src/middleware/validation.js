const Joi = require('joi');
const logger = require('../utils/logger');

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      logger.warn(`Validation error: ${error.details[0].message}`);
      return res.status(400).json({ error: error.details[0].message });
    }
    next();
  };
};

// User schemas
const userSchemas = {
  register: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().max(50),
    lastName: Joi.string().max(50)
  }),
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),
  update: Joi.object({
    username: Joi.string().alphanum().min(3).max(30),
    email: Joi.string().email(),
    firstName: Joi.string().max(50),
    lastName: Joi.string().max(50),
    currentPassword: Joi.string().min(8),
    newPassword: Joi.string().min(8)
  }).min(1)
};

// Server schemas
const serverSchemas = {
  create: Joi.object({
    name: Joi.string().min(3).max(50).required(),
    gameType: Joi.string().required(),
    description: Joi.string().max(500),
    cpu: Joi.number().integer().min(1).required(),
    memory: Joi.number().integer().min(512).required(),
    storage: Joi.number().integer().min(1).required(),
    autoBackup: Joi.boolean(),
    backupFrequency: Joi.number().integer().min(1),
    maxBackups: Joi.number().integer().min(1)
  }),
  update: Joi.object({
    name: Joi.string().min(3).max(50),
    description: Joi.string().max(500),
    cpu: Joi.number().integer().min(1),
    memory: Joi.number().integer().min(512),
    storage: Joi.number().integer().min(1),
    autoBackup: Joi.boolean(),
    backupFrequency: Joi.number().integer().min(1),
    maxBackups: Joi.number().integer().min(1)
  }).min(1)
};

// Script schemas
const scriptSchemas = {
  generate: Joi.object({
    name: Joi.string().min(3).max(50).required(),
    gameType: Joi.string().required(),
    scriptType: Joi.string().valid('dockerfile', 'config', 'startup', 'custom').required(),
    language: Joi.string().default('bash'),
    serverId: Joi.string().hex().length(24),
    parameters: Joi.object().required()
  }),
  update: Joi.object({
    name: Joi.string().min(3).max(50),
    content: Joi.string().required()
  }).min(1)
};

module.exports = {
  validate,
  userSchemas,
  serverSchemas,
  scriptSchemas
}; 