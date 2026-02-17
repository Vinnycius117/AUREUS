import Stripe from 'stripe';
import { VercelRequest, VercelResponse } from '@vercel/node';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2026-01-28.clover' as any,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method === 'POST') {
        try {
            const { priceId, userId, email } = req.body;
            console.log('Initiating checkout for:', { priceId, userId, email });

            if (!priceId || !userId || !email) {
                return res.status(400).json({ message: 'priceId, userId e email são obrigatórios' });
            }

            if (!process.env.STRIPE_SECRET_KEY) {
                console.error('STRIPE_SECRET_KEY is missing');
                return res.status(500).json({ message: 'Configuração do Stripe incompleta no servidor' });
            }

            // ── Customer Lookup/Creation ──────────────────────────────────
            // Search for existing customer by email
            const customers = await stripe.customers.list({
                email: email,
                limit: 1,
            });

            let customerId;

            if (customers.data.length > 0) {
                customerId = customers.data[0].id;
                console.log('Using existing customer:', customerId);
            } else {
                // Create new customer
                const customer = await stripe.customers.create({
                    email: email,
                    metadata: {
                        supabase_user_id: userId,
                    },
                });
                customerId = customer.id;
                console.log('Created new customer:', customerId);
            }

            const session = await stripe.checkout.sessions.create({
                customer: customerId,
                payment_method_types: ['card'],
                line_items: [
                    {
                        price: priceId,
                        quantity: 1,
                    },
                ],
                mode: 'subscription',
                success_url: `${req.headers.origin}/?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${req.headers.origin}/`,
                metadata: {
                    userId: userId,
                },
            });

            console.log('Session created:', session.id);
            res.status(200).json({ url: session.url });
        } catch (err: any) {
            console.error('Stripe Session Error:', err);
            res.status(500).json({ statusCode: 500, message: err.message });
        }
    } else {
        res.setHeader('Allow', 'POST');
        res.status(405).end('Method Not Allowed');
    }
}
