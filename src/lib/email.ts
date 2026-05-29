import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY!);
export const mail = process.env.RESEND_EMAIL!;

export async function sendResetPasswordEmail(
  to: string,
  token: string
) {
  return resend.emails.send({
    from: mail,
    to,
    subject: "Reset your password",
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>Password Reset</h2>

        <p>You requested a password reset.</p>

        <p>Use the token below to reset your password:</p>

        <div
          style="
            padding: 12px;
            background: #f4f4f4;
            border-radius: 8px;
            font-family: monospace;
            font-size: 18px;
            word-break: break-all;
          "
        >
          ${token}
        </div>

        <p style="margin-top: 16px;">
          This token will expire in 1 hour.
        </p>
      </div>
    `
  });
}