const axios = require('axios');
const crypto = require('crypto');

/**
 * Sends processed result to a registered webhook URL.
 */
const sendWebhook = async (webhookUrl, payload, secret = null) => {
  const body = JSON.stringify(payload);
  const headers = { 'Content-Type': 'application/json' };

  // Sign payload if secret provided
  if (secret) {
    const sig = crypto.createHmac('sha256', secret).update(body).digest('hex');
    headers['X-Webhook-Signature'] = `sha256=${sig}`;
  }

  try {
    const response = await axios.post(webhookUrl, payload, { headers, timeout: 10000 });
    return { success: true, status: response.status };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

module.exports = { sendWebhook };
