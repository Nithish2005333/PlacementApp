const axios = require('axios');

/**
 * Minimal WhatsApp sender abstraction.
 * Supports provider via env:
 *  - WHATSAPP_PROVIDER: 'ultramsg' | 'meta' | 'mock'
 *  - ULTRAMSG_INSTANCE, ULTRAMSG_TOKEN
 *  - META_WABA_PHONE_ID, META_WABA_TOKEN
 */
async function sendWhatsAppMessage(toE164WithoutPlus, message) {
  const provider = (process.env.WHATSAPP_PROVIDER || 'mock').toLowerCase();
  if (!toE164WithoutPlus || !/^[0-9]{9,15}$/.test(toE164WithoutPlus)) {
    throw new Error('Invalid WhatsApp number');
  }
  if (!message || typeof message !== 'string') {
    throw new Error('Invalid message');
  }

  if (provider === 'mock') {
    console.log(`[WHATSAPP MOCK] to:${toE164WithoutPlus} msg:${message}`);
    return { ok: true, mock: true };
  }

  if (provider === 'ultramsg') {
    const instance = process.env.ULTRAMSG_INSTANCE;
    const token = process.env.ULTRAMSG_TOKEN;
    if (!instance || !token) throw new Error('Ultramsg env not configured');
    const url = `https://api.ultramsg.com/${encodeURIComponent(instance)}/messages/chat`;
    const payload = { token, to: toE164WithoutPlus, body: message };
    const { data } = await axios.post(url, payload, { timeout: 15000 });
    return data || { ok: true };
  }

  if (provider === 'meta') {
    const phoneId = process.env.META_WABA_PHONE_ID;
    const token = process.env.META_WABA_TOKEN;
    if (!phoneId || !token) throw new Error('Meta WABA env not configured');
    const url = `https://graph.facebook.com/v18.0/${encodeURIComponent(phoneId)}/messages`;
    const payload = {
      messaging_product: 'whatsapp',
      to: toE164WithoutPlus,
      type: 'text',
      text: { body: message },
    };
    const { data } = await axios.post(url, payload, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 15000,
    });
    return data || { ok: true };
  }

  throw new Error(`Unsupported provider: ${provider}`);
}

async function sendWhatsAppTemplateMessage(toE164WithoutPlus, templateName, params = [], language = 'en') {
  const provider = (process.env.WHATSAPP_PROVIDER || 'mock').toLowerCase();
  if (provider === 'mock') {
    console.log(`[WHATSAPP MOCK TEMPLATE] to:${toE164WithoutPlus} template:${templateName} params:${JSON.stringify(params)}`);
    return { ok: true, mock: true };
  }
  if (provider !== 'meta') throw new Error('Template messages supported only for meta provider');

  const phoneId = process.env.META_WABA_PHONE_ID;
  const token = process.env.META_WABA_TOKEN;
  if (!phoneId || !token) throw new Error('Meta WABA env not configured');
  const url = `https://graph.facebook.com/v18.0/${encodeURIComponent(phoneId)}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    to: toE164WithoutPlus,
    type: 'template',
    template: {
      name: templateName,
      language: { code: language },
      components: params.length ? [
        {
          type: 'body',
          parameters: params.map(p => ({ type: 'text', text: String(p) })),
        },
      ] : undefined,
    },
  };
  const { data } = await axios.post(url, payload, {
    headers: { Authorization: `Bearer ${token}` },
    timeout: 15000,
  });
  return data || { ok: true };
}

module.exports = { sendWhatsAppMessage, sendWhatsAppTemplateMessage };


