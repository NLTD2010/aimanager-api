import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendResetPasswordEmail(to: string, resetLink: string) {
  return resend.emails.send({
    from: 'NLTD2010 <onboarding@resend.dev>',
    to,
    subject: "Reset your password",
    html: `
      <p>You requested a password reset.</p>
      <p>Click the link below:</p>
      <a href="${resetLink}">${resetLink}</a>
    `
  });
}