const SCRIPT_SECRET = 'REPLACE_WITH_A_LONG_RANDOM_SECRET';

function doPost(e) {
  try {
    const payload = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (!payload.secret || payload.secret !== SCRIPT_SECRET) {
      return jsonResponse({ success: false, error: 'unauthorized' }, 401);
    }

    const to = String(payload.to || '').trim();
    const subject = String(payload.subject || '深夜信箱验证码').trim();
    const text = String(payload.text || '').trim();
    const html = String(payload.html || '').trim();
    if (!to || !text || !html || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(to)) {
      return jsonResponse({ success: false, error: 'invalid_payload' }, 400);
    }

    GmailApp.sendEmail(to, subject, text, {
      htmlBody: html,
      name: '深夜信箱'
    });
    return jsonResponse({ success: true }, 200);
  } catch (error) {
    console.error(error && error.message ? error.message : error);
    return jsonResponse({ success: false, error: 'mail_send_failed' }, 500);
  }
}

function jsonResponse(body, status) {
  return ContentService
    .createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}
