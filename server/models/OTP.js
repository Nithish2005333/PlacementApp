const mongoose = require('mongoose');

const OTPSchema = new mongoose.Schema({
  // Either phone or email will be set depending on channel
  phone: { type: String, index: true },
  email: { type: String, index: true },
  code: { type: String, required: true },
  purpose: { type: String, enum: ['register','phone_change','forgot_password','email_change'], required: true },
  expiresAt: { type: Date, required: true, index: true },
  attempts: { type: Number, default: 0 },
}, { timestamps: true });

OTPSchema.index({ phone: 1, purpose: 1 });
OTPSchema.index({ email: 1, purpose: 1 });

module.exports = mongoose.model('OTP', OTPSchema);


