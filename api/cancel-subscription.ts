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
        const { subscriptionId, userId } = req.body;

        if (!subscriptionId || !userId) {
            return res.status(400).json({ success: false, message: 'subscriptionId e userId são obrigatórios' });
        }

        // Cancel at period end (user keeps access until end of billing cycle)
        const subscription = await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true,
        });

        // Update Supabase subscription status
        const { error } = await supabase
            .from('subscriptions')
            .update({
                status: 'canceling',
                current_period_end: new Date(subscription.billing_cycle_anchor! * 1000 + 30 * 24 * 60 * 60 * 1000).toISOString(),
            })
            .eq('user_id', userId);

        if (error) {
            console.error('Supabase update error:', error);
        }

        console.log(`✅ Subscription ${subscriptionId} set to cancel at period end for user ${userId}`);
        return res.status(200).json({ success: true });

    } catch (err: any) {
        console.error('Cancel subscription error:', err);
        return res.status(500).json({
            success: false,
            message: err.message || 'Erro ao cancelar assinatura'
        });
    }
}
