const nodemailer = require('nodemailer');

// Email configuration (using Gmail)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'frankkarani280@gmail.com',
        pass: 'uhqg ngro ijpg udqw'  // YOU NEED TO CREATE APP PASSWORD
    }
});

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTPEmail(email, otp) {
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Courier New', monospace; background: #0a0a0a; color: #00ff41; padding: 20px; }
                .container { max-width: 500px; margin: 0 auto; background: #0d0d0d; border: 2px solid #00ff41; border-radius: 10px; padding: 30px; }
                .otp { font-size: 36px; text-align: center; letter-spacing: 5px; background: #000; padding: 20px; margin: 20px 0; }
                .header { text-align: center; border-bottom: 1px solid #00ff41; padding-bottom: 20px; }
                .warning { color: #ff4444; font-size: 12px; text-align: center; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>🔐 4PP3X SECURE PORTAL</h2>
                    <p>Frank Karani | Cybersecurity Professional</p>
                </div>
                <p>Your One-Time Password (OTP) for admin access:</p>
                <div class="otp"><strong>${otp}</strong></div>
                <p>This OTP expires in <strong>10 minutes</strong>.</p>
                <div class="warning">
                    ⚠️ NEVER share this code with anyone!
                </div>
            </div>
        </body>
        </html>
    `;

    await transporter.sendMail({
        from: '"4PP3X Security" <frankkarani280@gmail.com>',
        to: email,
        subject: '🔐 2FA Verification Code - Your Portfolio',
        html: html
    });
}

module.exports = { generateOTP, sendOTPEmail };