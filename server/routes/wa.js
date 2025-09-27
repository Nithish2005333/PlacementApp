const express = require('express');
const { sendWhatsAppMessage, sendWhatsAppTemplateMessage } = require('../lib/whatsapp');

const router = express.Router();

// Deprecated: WhatsApp OTP sender (kept for backward compatibility)
router.post('/send-otp', async (req, res) => {
  try {
    const { to, otp } = req.body || {};
    const normalizedTo = String(to || '').replace(/[^0-9]/g, '');
    const code = String(otp || '').trim();

    if (!normalizedTo || normalizedTo.length < 9 || normalizedTo.length > 15) {
      return res.status(400).json({ error: 'Invalid recipient phone number. Use international format with country code.' });
    }
    if (!/^\d{4,8}$/.test(code)) {
      return res.status(400).json({ error: 'Invalid OTP format' });
    }

    const message = `Your OTP code is: ${code} \uD83D\uDD10`;

    const provider = (process.env.WHATSAPP_PROVIDER || 'mock').toLowerCase();

    try {
      const data = await sendWhatsAppMessage(normalizedTo, message);
      return res.json({ ok: true, provider, mode: 'text', response: data });
    } catch (err) {
      // If Meta rejects free-text (no 24h window), retry with template
      const status = err?.response?.status;
      if (provider === 'meta' && status === 400) {
        try {
          const tpl = process.env.META_OTP_TEMPLATE || 'otp_code';
          const lang = process.env.META_OTP_LANGUAGE || 'en';
          const data = await sendWhatsAppTemplateMessage(normalizedTo, tpl, [code], lang);
          return res.json({ ok: true, provider, mode: 'template', template: tpl, response: data });
        } catch (e2) {
          const apiData = e2?.response?.data;
          return res.status(e2?.response?.status || 500).json({ error: 'Template send failed', details: apiData || e2?.message });
        }
      }
      const apiData = err?.response?.data;
      return res.status(status || 500).json({ error: 'WhatsApp API error', details: apiData || err?.message });
    }
  } catch (err) {
    const status = err?.response?.status;
    const apiData = err?.response?.data;
    console.error('send-otp error:', err?.message || err);
    if (status) {
      return res.status(status).json({ error: 'WhatsApp API error', details: apiData });
    }
    return res.status(500).json({ error: 'Failed to send OTP' });
  }
});

module.exports = router;


