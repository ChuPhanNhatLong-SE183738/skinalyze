import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend;
  private fromEmail: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    const fromEmail = this.configService.get<string>('RESEND_FROM_EMAIL');
    if (!apiKey || !fromEmail) {
      this.logger.error(
        '❌ RESEND_API_KEY or RESEND_FROM_EMAIL is missing in environment variables',
      );
      throw new Error('Resend API key or from email missing');
    }
    this.fromEmail = fromEmail;
    this.resend = new Resend(apiKey);
    this.logger.log('✅ Resend email service initialized');
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const frontendUrl = this.configService.get(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;
    const html = this.createVerificationEmailTemplate(verificationUrl);
    const subject = '🔬 Xác Thực Email - Skinalyze AI Platform';
    await this.sendEmail(
      email,
      subject,
      html,
      `Vui lòng xác thực email tại: ${verificationUrl}`,
    );
  }

  async sendWelcomeEmail(email: string, fullName: string): Promise<void> {
    const html = this.createWelcomeEmailTemplate(fullName);
    const subject = '🎉 Chào mừng đến với Skinalyze!';
    await this.sendEmail(
      email,
      subject,
      html,
      `Chào mừng ${fullName} đến với Skinalyze AI Platform!`,
    );
  }

  async sendForgotPasswordEmail(email: string, token: string): Promise<void> {
    const frontendUrl = this.configService.get(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
    const html = this.createForgotPasswordEmailTemplate(resetUrl);
    const subject = '🔑 Đặt lại mật khẩu - Skinalyze';
    await this.sendEmail(
      email,
      subject,
      html,
      `Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng truy cập: ${resetUrl}`,
    );
  }

  async sendForgotPasswordOtpEmail(email: string, otp: string): Promise<void> {
    const html = this.createForgotPasswordOtpEmailTemplate(otp);
    const subject = '🔑 Mã xác thực đặt lại mật khẩu (OTP) - Skinalyze';
    await this.sendEmail(
      email,
      subject,
      html,
      `Mã OTP đặt lại mật khẩu của bạn là: ${otp}`,
    );
  }

  async sendAdminPasswordResetEmail(
    email: string,
    fullName: string,
    newPassword: string,
  ): Promise<void> {
    const html = this.createAdminPasswordResetTemplate(fullName, newPassword);
    const subject = '🔐 Mật khẩu của bạn đã được đặt lại - Skinalyze';
    await this.sendEmail(
      email,
      subject,
      html,
      `Mật khẩu tạm thời của bạn là: ${newPassword}. Vui lòng đổi mật khẩu sau khi đăng nhập.`,
    );
  }

  private async sendEmail(
    to: string,
    subject: string,
    html: string,
    text: string,
  ) {
    try {
      this.logger.log(`📧 Attempting to send email to: ${to}`);

      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject,
        html,
        text,
      });

      if (result.error) {
        this.logger.error(
          `❌ Resend API error for ${to}:`,
          JSON.stringify(result.error),
        );
        throw new Error(`Resend API error: ${result.error.message}`);
      }

      this.logger.log(
        `✅ Email sent successfully to: ${to} (ID: ${result.data?.id})`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Email send failed to ${to}:`,
        error.message,
        error.stack,
      );
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  private createVerificationEmailTemplate(verificationUrl: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Xác Thực Email - Skinalyze</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <!-- Header với gradient xanh dương chuyên nghiệp -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; border-radius: 15px 15px 0 0; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
            <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">🔬 SKINALYZE</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px; font-weight: 500;">AI-Powered Skin Analysis Platform</p>
        </div>
        
        <div style="background: white; padding: 50px 40px; border-radius: 0 0 15px 15px; box-shadow: 0 8px 25px rgba(0,0,0,0.1);">
            <!-- Icon container với gradient mới -->
            <div style="text-align: center; margin-bottom: 40px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); width: 100px; height: 100px; border-radius: 50%; margin: 0 auto 25px; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);">
                    <span style="font-size: 45px; line-height: 1;">✉️</span>
                </div>
                <h2 style="color: #667eea; margin: 0; font-size: 24px; font-weight: bold;">Xác Thực Email Của Bạn</h2>
            </div>
            
            <div style="text-align: center; margin-bottom: 30px;">
                <p style="font-size: 18px; margin-bottom: 15px; color: #2C3E50;">Chào mừng bạn đến với <strong style="color: #667eea;">Skinalyze</strong>! 🎉</p>
                <p style="font-size: 16px; margin-bottom: 0; color: #666;">Vui lòng click vào nút bên dưới để xác thực email và kích hoạt tài khoản:</p>
            </div>
            
            <!-- Button với gradient mới -->
            <div style="text-align: center; margin: 50px 0;">
                <a href="${verificationUrl}" 
                   style="display: inline-block; padding: 18px 45px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4); transition: all 0.3s ease;">
                    🔐 Xác Thực Email Ngay
                </a>
            </div>
            
            <!-- Thông tin bảo mật với màu xanh dương -->
            <div style="background: linear-gradient(135deg, #f0f3ff 0%, #e8ecff 100%); border-left: 5px solid #667eea; padding: 25px; margin: 40px 0; border-radius: 8px;">
                <h3 style="color: #667eea; margin: 0 0 15px 0; font-size: 18px; display: flex; align-items: center;">
                    <span style="margin-right: 10px;">🛡️</span>Lưu Ý Bảo Mật
                </h3>
                <ul style="margin: 0; padding-left: 25px; color: #2C3E50; line-height: 1.8;">
                    <li>Link này chỉ có hiệu lực trong <strong>24 giờ</strong></li>
                    <li>Nếu bạn không đăng ký, hãy bỏ qua email này</li>
                    <li>Không chia sẻ link này với ai khác</li>
                    <li>Liên hệ hỗ trợ nếu có thắc mắc</li>
                </ul>
            </div>
            
            <!-- Benefits section -->
            <div style="background: #F8F9FA; padding: 25px; border-radius: 8px; margin: 30px 0;">
                <h3 style="color: #667eea; margin: 0 0 15px 0; font-size: 18px; text-align: center;">🌟 Khám phá tính năng của Skinalyze</h3>
                <div style="display: flex; flex-wrap: wrap; justify-content: space-around; text-align: center;">
                    <div style="flex: 1; min-width: 120px; margin: 10px;">
                        <div style="font-size: 24px; margin-bottom: 8px;">🤖</div>
                        <p style="font-size: 14px; color: #666; margin: 0;">Phân tích da bằng AI</p>
                    </div>
                    <div style="flex: 1; min-width: 120px; margin: 10px;">
                        <div style="font-size: 24px; margin-bottom: 8px;">�</div>
                        <p style="font-size: 14px; color: #666; margin: 0;">Gợi ý sản phẩm</p>
                    </div>
                    <div style="flex: 1; min-width: 120px; margin: 10px;">
                        <div style="font-size: 24px; margin-bottom: 8px;">�</div>
                        <p style="font-size: 14px; color: #666; margin: 0;">Theo dõi kết quả</p>
                    </div>
                </div>
            </div>
            
            <p style="text-align: center; color: #7F8C8D; font-style: italic; font-size: 16px; margin-top: 30px;">
                Cảm ơn bạn đã tin tưởng Skinalyze! �
            </p>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; padding: 30px 20px; color: #95A5A6; font-size: 14px; background: #ECF0F1; border-radius: 0 0 15px 15px;">
            <p style="margin: 0 0 8px 0;"><strong style="color: #667eea;">Skinalyze</strong> - Nền tảng phân tích da bằng AI</p>
            <p style="margin: 0; font-size: 12px;">© 2025 Skinalyze. All rights reserved.</p>
            <div style="margin-top: 15px;">
                <span style="margin: 0 10px; color: #27AE60;">📧</span>
                <span style="margin: 0 10px; color: #27AE60;">📱</span>
                <span style="margin: 0 10px; color: #27AE60;">🌐</span>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  private createWelcomeEmailTemplate(fullName: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Chào mừng - Skinalyze</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <!-- Header với gradient xanh dương -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; border-radius: 15px 15px 0 0; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
            <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">🔬 SKINALYZE</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px; font-weight: 500;">AI-Powered Skin Analysis Platform</p>
        </div>
        
        <div style="background: white; padding: 50px 40px; border-radius: 0 0 15px 15px; box-shadow: 0 8px 25px rgba(0,0,0,0.1);">
            <!-- Welcome icon -->
            <div style="text-align: center; margin-bottom: 40px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); width: 100px; height: 100px; border-radius: 50%; margin: 0 auto 25px; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);">
                    <span style="font-size: 45px; line-height: 1;">🎉</span>
                </div>
                <h2 style="color: #667eea; margin: 0; font-size: 26px; font-weight: bold;">Chào mừng ${fullName}!</h2>
            </div>
            
            <div style="text-align: center; margin-bottom: 40px;">
                <p style="font-size: 18px; margin-bottom: 15px; color: #2C3E50;">
                    Cảm ơn bạn đã tham gia <strong style="color: #667eea;">Skinalyze</strong>! �
                </p>
                <p style="font-size: 16px; color: #666;">
                    Tài khoản của bạn đã được xác thực thành công. Hãy khám phá AI phân tích da!
                </p>
            </div>
            
            <!-- Features grid -->
            <div style="background: linear-gradient(135deg, #f0f3ff 0%, #e8ecff 100%); border-left: 5px solid #667eea; padding: 30px; margin: 40px 0; border-radius: 8px;">
                <h3 style="color: #667eea; margin: 0 0 25px 0; font-size: 20px; text-align: center; display: flex; align-items: center; justify-content: center;">
                    <span style="margin-right: 10px;">🎯</span>Những gì bạn có thể làm
                </h3>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
                    <div style="text-align: center; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                        <div style="font-size: 30px; margin-bottom: 10px;">🤖</div>
                        <h4 style="color: #667eea; margin: 0 0 8px 0; font-size: 16px;">Phân tích da AI</h4>
                        <p style="color: #666; margin: 0; font-size: 14px;">Công nghệ AI tiên tiến</p>
                    </div>
                    
                    <div style="text-align: center; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                        <div style="font-size: 30px; margin-bottom: 10px;">�</div>
                        <h4 style="color: #667eea; margin: 0 0 8px 0; font-size: 16px;">Gợi ý sản phẩm</h4>
                        <p style="color: #666; margin: 0; font-size: 14px;">Phù hợp da bạn</p>
                    </div>
                    
                    <div style="text-align: center; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                        <div style="font-size: 30px; margin-bottom: 10px;">�</div>
                        <h4 style="color: #667eea; margin: 0 0 8px 0; font-size: 16px;">Theo dõi tiến độ</h4>
                        <p style="color: #666; margin: 0; font-size: 14px;">Lịch sử phân tích</p>
                    </div>
                    
                    <div style="text-align: center; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                        <div style="font-size: 30px; margin-bottom: 10px;">🛒</div>
                        <h4 style="color: #667eea; margin: 0 0 8px 0; font-size: 16px;">Mua sắm</h4>
                        <p style="color: #666; margin: 0; font-size: 14px;">Sản phẩm chất lượng</p>
                    </div>
                </div>
            </div>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 40px 0;">
                <a href="${this.configService.get('FRONTEND_URL', 'http://localhost:3000')}" 
                   style="display: inline-block; padding: 18px 45px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);">
                    🚀 Bắt Đầu Ngay
                </a>
            </div>
            
            <p style="text-align: center; color: #7F8C8D; font-style: italic; font-size: 16px; margin-top: 30px;">
                Chúc bạn có trải nghiệm tuyệt vời với Skinalyze! �
            </p>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; padding: 30px 20px; color: #95A5A6; font-size: 14px; background: #ECF0F1; border-radius: 0 0 15px 15px;">
            <p style="margin: 0 0 8px 0;"><strong style="color: #667eea;">Skinalyze</strong> - Nền tảng phân tích da bằng AI</p>
            <p style="margin: 0; font-size: 12px;">© 2025 Skinalyze. All rights reserved.</p>
            <div style="margin-top: 15px;">
                <span style="margin: 0 10px; color: #667eea;">📧</span>
                <span style="margin: 0 10px; color: #667eea;">📱</span>
                <span style="margin: 0 10px; color: #667eea;">🌐</span>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  private createForgotPasswordEmailTemplate(resetUrl: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Đặt lại mật khẩu - Skinalyze</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; border-radius: 15px 15px 0 0; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
            <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">🔬 SKINALYZE</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px; font-weight: 500;">AI-Powered Skin Analysis Platform</p>
        </div>
        <div style="background: white; padding: 50px 40px; border-radius: 0 0 15px 15px; box-shadow: 0 8px 25px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 40px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); width: 100px; height: 100px; border-radius: 50%; margin: 0 auto 25px; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);">
                    <span style="font-size: 45px; line-height: 1;">🔑</span>
                </div>
                <h2 style="color: #667eea; margin: 0; font-size: 24px; font-weight: bold;">Yêu cầu đặt lại mật khẩu</h2>
            </div>
            <div style="text-align: center; margin-bottom: 30px;">
                <p style="font-size: 18px; margin-bottom: 15px; color: #2C3E50;">Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
                <p style="font-size: 16px; margin-bottom: 0; color: #666;">Nhấn vào nút bên dưới để đặt lại mật khẩu:</p>
            </div>
            <div style="text-align: center; margin: 50px 0;">
                <a href="${resetUrl}" 
                   style="display: inline-block; padding: 18px 45px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px; box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4); transition: all 0.3s ease;">
                    🔒 Đặt lại mật khẩu
                </a>
            </div>
            <div style="background: linear-gradient(135deg, #f0f3ff 0%, #e8ecff 100%); border-left: 5px solid #667eea; padding: 25px; margin: 40px 0; border-radius: 8px;">
                <h3 style="color: #667eea; margin: 0 0 15px 0; font-size: 18px; display: flex; align-items: center;">
                    <span style="margin-right: 10px;">🛡️</span>Lưu ý bảo mật
                </h3>
                <ul style="margin: 0; padding-left: 25px; color: #2C3E50; line-height: 1.8;">
                    <li>Link này chỉ có hiệu lực trong <strong>30 phút</strong></li>
                    <li>Nếu bạn không yêu cầu, hãy bỏ qua email này</li>
                    <li>Không chia sẻ link này với ai khác</li>
                </ul>
            </div>
            <p style="text-align: center; color: #7F8C8D; font-style: italic; font-size: 16px; margin-top: 30px;">
                Nếu bạn gặp khó khăn, hãy liên hệ với đội ngũ hỗ trợ của chúng tôi.
            </p>
        </div>
        <div style="text-align: center; padding: 30px 20px; color: #95A5A6; font-size: 14px; background: #ECF0F1; border-radius: 0 0 15px 15px;">
            <p style="margin: 0 0 8px 0;"><strong style="color: #667eea;">Skinalyze</strong> - Nền tảng phân tích da bằng AI</p>
            <p style="margin: 0; font-size: 12px;">© 2025 Skinalyze. All rights reserved.</p>
            <div style="margin-top: 15px;">
                <span style="margin: 0 10px; color: #667eea;">📧</span>
                <span style="margin: 0 10px; color: #667eea;">📱</span>
                <span style="margin: 0 10px; color: #667eea;">🌐</span>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  private createForgotPasswordOtpEmailTemplate(otp: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Mã OTP đặt lại mật khẩu - Skinora</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background: linear-gradient(135deg, #2ECC71 0%, #27AE60 100%); padding: 40px 30px; text-align: center; border-radius: 15px 15px 0 0; box-shadow: 0 4px 15px rgba(46, 204, 113, 0.3);">
            <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">🏥 SKINORA</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px; font-weight: 500;">Healthcare & Skincare Solution</p>
        </div>
        <div style="background: white; padding: 50px 40px; border-radius: 0 0 15px 15px; box-shadow: 0 8px 25px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 40px;">
                <div style="background: linear-gradient(135deg, #2ECC71 0%, #27AE60 100%); width: 100px; height: 100px; border-radius: 50%; margin: 0 auto 25px; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 6px 20px rgba(46, 204, 113, 0.4);">
                    <span style="font-size: 45px; line-height: 1;">🔑</span>
                </div>
                <h2 style="color: #27AE60; margin: 0; font-size: 24px; font-weight: bold;">Mã OTP đặt lại mật khẩu</h2>
            </div>
            <div style="text-align: center; margin-bottom: 30px;">
                <p style="font-size: 18px; margin-bottom: 15px; color: #2C3E50;">Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản Skinora.</p>
                <p style="font-size: 16px; margin-bottom: 0; color: #666;">Vui lòng nhập mã OTP bên dưới vào ứng dụng hoặc website để tiếp tục:</p>
            </div>
            <div style="text-align: center; margin: 40px 0;">
                <div style="display: inline-block; padding: 18px 45px; background: linear-gradient(135deg, #2ECC71 0%, #27AE60 100%); color: white; border-radius: 50px; font-weight: bold; font-size: 32px; letter-spacing: 8px; box-shadow: 0 6px 20px rgba(46, 204, 113, 0.4);">
                  ${otp}
                </div>
            </div>
            <div style="background: linear-gradient(135deg, #E8F8F5 0%, #D5F4E6 100%); border-left: 5px solid #27AE60; padding: 25px; margin: 40px 0; border-radius: 8px;">
                <h3 style="color: #27AE60; margin: 0 0 15px 0; font-size: 18px; display: flex; align-items: center;">
                    <span style="margin-right: 10px;">🛡️</span>Lưu ý bảo mật
                </h3>
                <ul style="margin: 0; padding-left: 25px; color: #2C3E50; line-height: 1.8;">
                    <li>Mã OTP chỉ có hiệu lực trong <strong>10 phút</strong></li>
                    <li>Không chia sẻ mã này với bất kỳ ai</li>
                    <li>Nếu bạn không yêu cầu, hãy bỏ qua email này</li>
                </ul>
            </div>
            <p style="text-align: center; color: #7F8C8D; font-style: italic; font-size: 16px; margin-top: 30px;">
                Nếu bạn gặp khó khăn, hãy liên hệ với đội ngũ hỗ trợ của chúng tôi.
            </p>
        </div>
        <div style="text-align: center; padding: 30px 20px; color: #95A5A6; font-size: 14px; background: #ECF0F1; border-radius: 0 0 15px 15px;">
            <p style="margin: 0 0 8px 0;"><strong style="color: #27AE60;">Skinora Healthcare</strong> - Giải pháp chăm sóc da toàn diện</p>
            <p style="margin: 0; font-size: 12px;">© 2025 Skinora Healthcare. All rights reserved.</p>
            <div style="margin-top: 15px;">
                <span style="margin: 0 10px; color: #27AE60;">📧</span>
                <span style="margin: 0 10px; color: #27AE60;">📱</span>
                <span style="margin: 0 10px; color: #27AE60;">🌐</span>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  private createAdminPasswordResetTemplate(
    fullName: string,
    newPassword: string,
  ): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 15px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                <h1 style="color: #FFFFFF; margin: 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    🔐 Đặt Lại Mật Khẩu
                </h1>
                <p style="color: #F0E6FF; margin: 10px 0 0 0; font-size: 16px;">
                    Mật khẩu tài khoản của bạn đã được quản trị viên đặt lại
                </p>
            </div>
            <div style="padding: 40px 30px;">
                <p style="color: #2C3E50; font-size: 18px; line-height: 1.8; margin: 0 0 20px 0;">
                    Xin chào <strong style="color: #667eea;">${fullName}</strong>,
                </p>
                <p style="color: #34495E; font-size: 16px; line-height: 1.8; margin: 0 0 25px 0;">
                    Quản trị viên đã đặt lại mật khẩu cho tài khoản của bạn. Đây là mật khẩu tạm thời của bạn:
                </p>
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 12px; text-align: center; margin: 30px 0; box-shadow: 0 5px 20px rgba(102, 126, 234, 0.3);">
                    <p style="color: #FFFFFF; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">
                        Mật Khẩu Tạm Thời
                    </p>
                    <p style="color: #FFFFFF; font-size: 32px; font-weight: 800; margin: 0; font-family: 'Courier New', monospace; letter-spacing: 4px; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                        ${newPassword}
                    </p>
                </div>
                <div style="background: #FFF3CD; border-left: 4px solid #FFC107; padding: 20px; border-radius: 8px; margin: 25px 0;">
                    <p style="color: #856404; margin: 0; font-size: 15px; line-height: 1.6;">
                        <strong>⚠️ Lưu ý quan trọng:</strong><br>
                        Vui lòng đổi mật khẩu ngay sau khi đăng nhập để bảo mật tài khoản của bạn.
                    </p>
                </div>
                <div style="background: #E8F5E9; border-left: 4px solid #4CAF50; padding: 20px; border-radius: 8px; margin: 25px 0;">
                    <p style="color: #2C3E50; margin: 0 0 15px 0; font-weight: 600; font-size: 16px;">📋 Hướng dẫn:</p>
                    <ol style="margin: 0; padding-left: 25px; color: #2C3E50; line-height: 1.8;">
                        <li>Đăng nhập bằng mật khẩu tạm thời ở trên</li>
                        <li>Vào phần <strong>Cài đặt tài khoản</strong></li>
                        <li>Chọn <strong>Đổi mật khẩu</strong></li>
                        <li>Nhập mật khẩu mới của bạn</li>
                    </ol>
                </div>
                <div style="background: #FFF3E0; border-left: 4px solid #FF9800; padding: 20px; border-radius: 8px; margin: 25px 0;">
                    <p style="color: #2C3E50; margin: 0 0 15px 0; font-weight: 600; font-size: 16px;">🔒 Bảo mật:</p>
                    <ul style="margin: 0; padding-left: 25px; color: #2C3E50; line-height: 1.8;">
                        <li>Không chia sẻ mật khẩu này với bất kỳ ai</li>
                        <li>Đổi mật khẩu ngay sau lần đăng nhập đầu tiên</li>
                        <li>Sử dụng mật khẩu mạnh: ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt</li>
                    </ul>
                </div>
            </div>
            <div style="text-align: center; padding: 30px 20px; color: #95A5A6; font-size: 14px; background: #ECF0F1; border-radius: 0 0 15px 15px;">
                <p style="margin: 0 0 8px 0;"><strong style="color: #667eea;">Skinalyze</strong> - AI-Powered Skincare Platform</p>
                <p style="margin: 0; font-size: 12px;">© 2025 Skinalyze. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Lưu preview template email (dùng cho debug/test UI email, không gửi thật)
   * Có thể log ra console hoặc lưu file nếu cần.
   */
  async saveEmailTemplatePreview(
    email: string,
    token: string,
    fullName?: string,
  ): Promise<void> {
    const frontendUrl = this.configService.get(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;
    const htmlContent = this.createVerificationEmailTemplate(verificationUrl);
    this.logger.log(`📧 [PREVIEW] Email template preview for: ${email}`);
    this.logger.log(`🔗 [PREVIEW] Verification URL: ${verificationUrl}`);
    if (fullName) {
      this.logger.log(`👤 [PREVIEW] Full name: ${fullName}`);
    }
    // Nếu muốn lưu ra file, có thể dùng fs.writeFileSync ở đây
    // fs.writeFileSync(`preview-${email}.html`, htmlContent);
  }
}
