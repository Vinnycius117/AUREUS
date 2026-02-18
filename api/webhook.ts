import Stripe from 'stripe';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import getRawBody from 'raw-body';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2026-01-28.clover' as any,
});

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method === 'POST') {
        const buf = await getRawBody(req);
        const sig = req.headers['stripe-signature'] as string;

        let event: Stripe.Event;

        try {
            event = stripe.webhooks.constructEvent(
                buf,
                sig,
                process.env.STRIPE_WEBHOOK_SECRET as string
            );
        } catch (err: any) {
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session;
            const userId = session.metadata?.userId;

            if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
                console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set! Cannot activate subscription.');
                return res.status(500).json({ error: 'Server configuration error' });
            }

            if (userId) {
                const { error } = await supabase.from('subscriptions').upsert({
                    user_id: userId,
                    stripe_customer_id: session.customer as string,
                    stripe_subscription_id: session.subscription as string,
                    status: 'active',
                    plan_type: 'pro',
                    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                }, { onConflict: 'user_id' });

                if (error) {
                    console.error('❌ Supabase upsert failed:', error);
                    return res.status(500).json({ error: 'Failed to activate subscription' });
                }

                console.log(`✅ Webhook: Subscription activated for user ${userId}`);
            } else {
                console.warn('⚠️ Webhook: No userId in session metadata');
            }
        }

        res.json({ received: true });
    } else {
        res.setHeader('Allow', 'POST');
        res.status(405).end('Method Not Allowed');
    }
}

export const config = {
    api: {
        bodyParser: false,
    },
};
