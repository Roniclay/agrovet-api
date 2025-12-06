import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

interface SendPasswordResetParams {
  to: string;
  name?: string;
  resetUrl: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter;
  private from: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('MAIL_HOST');
    const port = this.configService.get<number>('MAIL_PORT');
    const secureEnv = this.configService.get<string>('MAIL_SECURE');
    const user = this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('MAIL_PASS');

    this.from =
      this.configService.get<string>('MAIL_FROM') ?? 'no-reply@example.com';

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: secureEnv === 'true', // true para porta 465, false para 587/25
      auth: {
        user,
        pass,
      },
    });
  }

  async sendPasswordReset(params: SendPasswordResetParams): Promise<void> {
    const { to, name, resetUrl } = params;

    const subject = 'Recuperação de senha - AgroVet';
    const plainText = `
Olá${name ? `, ${name}` : ''}!

Recebemos uma solicitação para redefinir a sua senha no AgroVet.

Para continuar, acesse o link abaixo:
${resetUrl}

Se você não solicitou essa alteração, ignore este e-mail.

Atenciosamente,
Equipe AgroVet
    `.trim();

    const html = `
      <p>Olá${name ? `, <strong>${name}</strong>` : ''}!</p>
      <p>Recebemos uma solicitação para redefinir a sua senha no <strong>AgroVet</strong>.</p>
      <p>Para continuar, clique no botão abaixo (ou copie o link para o navegador):</p>
      <p>
        <a href="${resetUrl}" 
           style="display:inline-block;padding:10px 18px;background:#2563eb;color:#fff;
                  text-decoration:none;border-radius:6px;font-weight:600;">
          Redefinir senha
        </a>
      </p>
      <p>Link direto: <br><a href="${resetUrl}">${resetUrl}</a></p>
      <p>Se você não solicitou essa alteração, pode ignorar este e-mail com segurança.</p>
      <p>Atenciosamente,<br/>Equipe AgroVet</p>
    `.trim();

    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject,
        text: plainText,
        html,
      });

      this.logger.log(`E-mail de recuperação de senha enviado para ${to}`);
    } catch (error) {
      this.logger.error(
        `Erro ao enviar e-mail de recuperação de senha para ${to}`,
        (error as any)?.stack,
      );
      // opcional: lançar ou só logar
      // throw new InternalServerErrorException('Erro ao enviar e-mail');
    }
  }
}
