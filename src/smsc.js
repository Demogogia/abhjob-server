const https = require('https');
require('dotenv').config();

function sendSms(phone, message) {
  return new Promise((resolve, reject) => {
    // В режиме разработки — только логируем
    if (!process.env.SMSC_LOGIN || !process.env.SMSC_PASSWORD) {
      return resolve({ ok: true, dev: true });
    }

    const params = new URLSearchParams({
      login: process.env.SMSC_LOGIN,
      psw: process.env.SMSC_PASSWORD,
      phones: phone,
      mes: message,
      sender: 'AbhJob',
      fmt: 3, // JSON ответ
      charset: 'utf-8',
    });

    const url = `https://smsc.ru/sys/send.php?${params}`;

    https.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) reject(new Error(json.error_code));
          else resolve(json);
        } catch {
          reject(new Error('SMSC parse error'));
        }
      });
    }).on('error', reject);
  });
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 цифр
}

module.exports = { sendSms, generateCode };
