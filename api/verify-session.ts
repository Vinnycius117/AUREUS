import Stripe from 'stripe';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2026-01-28.clover' as any,
});

const supabase = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    try {
        const { sessionId, userId } = req.body;

        if (!sessionId || !userId) {
            return res.status(400).json({ message: 'sessionId e userId são obrigatórios' });
        }

        // Retrieve the checkout session from Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status !== 'paid') {
            return res.status(400).json({
                success: false,
                message: 'Pagamento não confirmado'
            });
        }

        // Verify the session belongs to this user
        if (session.metadata?.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Sessão não pertence a este usuário'
            });
        }

        // Upsert subscription in Supabase
        const { error } = await supabase.from('subscriptions').upsert({
            user_id: userId,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            status: 'active',
            plan_type: 'pro',
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }, { onConflict: 'user_id' });

        if (error) {
            console.error('Supabase upsert error:', error);
            return res.status(500).json({
                success: false,
                message: `Erro ao ativar assinatura: ${error.message}`
            });
        }

        console.log(`✅ Subscription activated for user ${userId}`);
        return res.status(200).json({ success: true, plan: 'pro' });

    } catch (err: any) {
        console.error('Verify session error:', err);
        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
}
