import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_ADDRESS = process.env.FROM_ADDRESS ?? 'Boda <noreply@resend.dev>';
const BATCH_SIZE = 50;

export const sendBulkEmail = async (to: string[], subject: string, html: string): Promise<void> => {
    for (let i = 0; i < to.length; i += BATCH_SIZE) {
        const batch = to.slice(i, i + BATCH_SIZE);
        const results = await Promise.all(
            batch.map(email => resend.emails.send({ from: FROM_ADDRESS, to: email, subject, html }))
        );
        for (const { error } of results) {
            if (error) throw new Error(`Resend error: ${error.message}`);
        }
    }
};
