import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

/**
 * Configuration for the email service.
 */
export interface EmailServiceConfig {
  awsRegion: string;
  fromEmail?: string;
}

/**
 * Sends transactional emails via AWS SES.
 * Falls back to console logging in development when SES_FROM_EMAIL is not set.
 */
export class EmailService {
  private readonly ses: SESClient;
  private readonly fromEmail: string | undefined;

  constructor(config: EmailServiceConfig) {
    this.ses = new SESClient({ region: config.awsRegion });
    this.fromEmail = config.fromEmail;
  }

  /**
   * Sends a classroom invite email to a student.
   */
  async sendInviteEmail(
    to: string,
    inviteUrl: string,
    classroomName: string,
    teacherName: string
  ): Promise<void> {
    const subject = `You've been invited to join "${classroomName}"`;
    const htmlBody = buildInviteHtml(inviteUrl, classroomName, teacherName);
    const textBody = buildInviteText(inviteUrl, classroomName, teacherName);

    if (!this.fromEmail) {
      console.log("[EmailService] SES_FROM_EMAIL not configured, logging invite:");
      console.log(`  To: ${to}`);
      console.log(`  Subject: ${subject}`);
      console.log(`  Invite URL: ${inviteUrl}`);
      return;
    }

    const command = new SendEmailCommand({
      Source: this.fromEmail,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject, Charset: "UTF-8" },
        Body: {
          Html: { Data: htmlBody, Charset: "UTF-8" },
          Text: { Data: textBody, Charset: "UTF-8" }
        }
      }
    });

    await this.ses.send(command);
  }
}

/** Builds the HTML email body for an invite. */
function buildInviteHtml(
  inviteUrl: string,
  classroomName: string,
  teacherName: string
): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
  <h1 style="color: #1a1a2e;">You're Invited!</h1>
  <p>${teacherName} has invited you to join the classroom <strong>${classroomName}</strong> on Odyssey.</p>
  <p>Click the button below to create your account and get started:</p>
  <p style="text-align: center; margin: 32px 0;">
    <a href="${inviteUrl}"
       style="background: #0369a1; color: white; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: bold;">
      Accept Invite
    </a>
  </p>
  <p style="color: #666; font-size: 14px;">
    This invite expires in 7 days. If the button doesn't work, copy and paste this URL into your browser:
  </p>
  <p style="color: #666; font-size: 14px; word-break: break-all;">${inviteUrl}</p>
</body>
</html>`.trim();
}

/** Builds the plain-text email body for an invite. */
function buildInviteText(
  inviteUrl: string,
  classroomName: string,
  teacherName: string
): string {
  return [
    `You're Invited!`,
    ``,
    `${teacherName} has invited you to join the classroom "${classroomName}" on Odyssey.`,
    ``,
    `Click the link below to create your account and get started:`,
    `${inviteUrl}`,
    ``,
    `This invite expires in 7 days.`
  ].join("\n");
}
