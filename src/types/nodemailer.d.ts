declare module 'nodemailer' {
  export interface MailOptions {
    from: string;
    to: string;
    subject: string;
    html: string;
    text?: string;
  }

  export interface Transporter {
    sendMail(mailOptions: MailOptions): Promise<unknown>;
  }

  export interface TransportOptions {
    service?: string;
    auth?: {
      user: string;
      pass: string;
    };
  }

  export function createTransport(options: TransportOptions): Transporter;
}
