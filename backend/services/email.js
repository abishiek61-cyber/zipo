const nodemailer = require('nodemailer');

const sendBookingConfirmation = async ({ to, name, package_name, slot, address, total, car }) => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS || process.env.GMAIL_USER.includes('your_gmail')) return;
  try {
    const t = nodemailer.createTransport({ service:'gmail', auth:{ user:process.env.GMAIL_USER, pass:process.env.GMAIL_PASS }});
    await t.sendMail({
      from: `"Zipo" <${process.env.GMAIL_USER}>`,
      to,
      subject: `Booking confirmed — ${package_name}`,
      html: `<p>Hi ${name}, your <b>${package_name}</b> is confirmed for ${slot} at ${address}. Car: ${car}. Total: ₹${total}.</p><p>Team Zipo</p>`
    });
    console.log('Email sent to', to);
  } catch(e) { console.error('Email error:', e.message); }
};

const sendReminder = async ({ to, name, package_name, slot, address, car }) => {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS || process.env.GMAIL_USER.includes('your_gmail')) return;
  try {
    const t = nodemailer.createTransport({ service:'gmail', auth:{ user:process.env.GMAIL_USER, pass:process.env.GMAIL_PASS }});
    await t.sendMail({
      from: `"Zipo" <${process.env.GMAIL_USER}>`,
      to,
      subject: `Reminder: Zipo appointment tomorrow`,
      html: `<p>Hi ${name}, reminder for your ${package_name} tomorrow at ${slot}, ${address}. Car: ${car}.</p><p>Team Zipo</p>`
    });
  } catch(e) { console.error('Reminder error:', e.message); }
};

module.exports = { sendBookingConfirmation, sendReminder };
