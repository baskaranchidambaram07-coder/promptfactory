const { Webhook } = require('../models');
const { sendWebhook } = require('../services/webhookService');
const crypto = require('crypto');

// Register a webhook endpoint
const registerWebhook = async (req, res) => {
  try {
    const { url } = req.body;
    const secret = crypto.randomBytes(20).toString('hex');
    const webhook = await Webhook.create({ user_id: req.user.id, url, secret });
    res.status(201).json(webhook);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// List user's webhooks
const getWebhooks = async (req, res) => {
  try {
    const webhooks = await Webhook.findAll({ where: { user_id: req.user.id } });
    res.json(webhooks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Manually send data to a webhook
const sendToWebhook = async (req, res) => {
  try {
    const { webhook_url, payload } = req.body;
    if (!webhook_url) return res.status(400).json({ error: 'webhook_url is required' });

    const result = await sendWebhook(webhook_url, payload || { test: true, timestamp: new Date() });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Receive incoming webhook (public endpoint)
const receiveWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-webhook-signature'];
    console.log('Webhook received:', { signature, body: req.body });
    // In production: verify signature, process event
    res.json({ received: true, timestamp: new Date() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { registerWebhook, getWebhooks, sendToWebhook, receiveWebhook };
