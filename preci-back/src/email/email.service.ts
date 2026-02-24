import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly isConfigured: boolean;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    if (apiKey) {
      sgMail.setApiKey(apiKey);
      this.isConfigured = true;
    } else {
      this.logger.warn(
        'SENDGRID_API_KEY not set — emails will be logged to console only',
      );
      this.isConfigured = false;
    }
  }

  async sendOtp(email: string, otp: string): Promise<void> {
    const fromEmail = this.configService.get<string>(
      'SENDGRID_FROM_EMAIL',
      'noreply@preci.pe',
    );
    const fromName = this.configService.get<string>(
      'SENDGRID_FROM_NAME',
      'Preci',
    );

    const html = this.buildOtpHtml(otp);

    if (!this.isConfigured) {
      this.logger.debug(
        `[DEV] OTP email to ${email} | code: ${otp} | subject: Tu codigo de verificacion de Preci`,
      );
      return;
    }

    await sgMail.send({
      to: email,
      from: { email: fromEmail, name: fromName },
      subject: 'Tu codigo de verificacion de Preci',
      html,
    });

    this.logger.log(`OTP email sent to ${email}`);
  }

  private buildOtpHtml(otp: string): string {
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Codigo de verificacion - Preci</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f7f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f4f7f6;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="520" style="max-width:520px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background-color:#16a34a;padding:32px 40px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <div style="display:inline-flex;align-items:center;gap:10px;">
                      <div style="width:36px;height:36px;background-color:#ffffff;border-radius:8px;display:inline-block;vertical-align:middle;line-height:36px;text-align:center;font-size:20px;">P</div>
                      <span style="font-size:26px;font-weight:800;color:#ffffff;vertical-align:middle;letter-spacing:-0.5px;">Preci</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;text-align:center;">
                Tu codigo de verificacion
              </h1>
              <p style="margin:0 0 32px;font-size:15px;color:#6b7280;text-align:center;line-height:1.5;">
                Usa este codigo para ingresar a tu cuenta en Preci.
              </p>

              <!-- OTP Box -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <div style="display:inline-block;background-color:#f0fdf4;border:2px solid #bbf7d0;border-radius:12px;padding:24px 48px;">
                      <span style="font-size:42px;font-weight:700;font-family:'Courier New',Courier,monospace;letter-spacing:10px;color:#16a34a;display:block;text-align:center;">${otp}</span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Expiry warning -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:24px;">
                <tr>
                  <td align="center">
                    <div style="display:inline-flex;align-items:center;gap:8px;background-color:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:10px 20px;">
                      <span style="font-size:16px;">&#9201;</span>
                      <span style="font-size:13px;color:#92400e;font-weight:500;">Este codigo expira en <strong>10 minutos</strong></span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background-color:#f3f4f6;"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px 32px;">
              <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;text-align:center;line-height:1.6;">
                Si no solicitaste este codigo, puedes ignorar este correo.<br/>
                Nadie de Preci te pedira este codigo.
              </p>
              <p style="margin:12px 0 0;font-size:12px;color:#d1d5db;text-align:center;">
                &copy; ${new Date().getFullYear()} Preci &mdash; Compara precios en Peru
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
}
