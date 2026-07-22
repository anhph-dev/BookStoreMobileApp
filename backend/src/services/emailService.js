const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function sendWelcomeEmail(email, fullName) {
  const firstName = String(fullName || '').trim().split(/\s+/).pop() || 'bạn';
  const safeFirstName = escapeHtml(firstName);
  const safeEmail = escapeHtml(email);

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #8B5E3C; padding: 32px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: #F5A623; margin: 0; font-size: 28px;">📚 BookStore</h1>
        <p style="color: #FFFBF5; margin: 8px 0 0;">Cửa hàng sách trực tuyến</p>
      </div>
      <div style="background: #FFFBF5; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #E5E7EB;">
        <h2 style="color: #1A1A2E;">Chào mừng, ${safeFirstName}! 🎉</h2>
        <p style="color: #6B7280; line-height: 1.6;">
          Cảm ơn bạn đã đăng ký tài khoản tại <strong>BookStore Mobile</strong>.
          Tài khoản của bạn đã được tạo thành công.
        </p>
        <div style="background: #F3F4F6; border-radius: 8px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0; color: #1A1A2E;"><strong>📧 Email:</strong> ${safeEmail}</p>
        </div>
        <p style="color: #6B7280; line-height: 1.6;">
          Bạn có thể bắt đầu khám phá hàng nghìn đầu sách, từ văn học
          đến kỹ năng sống và công nghệ — tất cả trong lòng bàn tay.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="#" style="background: #8B5E3C; color: white; padding: 14px 32px;
             border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
            Khám phá sách ngay →
          </a>
        </div>
        <p style="color: #9CA3AF; font-size: 13px; text-align: center; margin-top: 24px;">
          Nếu bạn không thực hiện đăng ký này, vui lòng bỏ qua email.<br/>
          © 2026 BookStore Mobile — SW312DL01
        </p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"BookStore Mobile" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Chào mừng ${firstName} đến với BookStore! 📚`,
      html: htmlContent,
    });
    console.log(`Welcome email sent to ${email}`);
  } catch (err) {
    // Email errors must not affect the registration flow.
    console.error('Email send error (non-critical):', err.message);
  }
}

module.exports = { sendWelcomeEmail };
