import { loadStripe } from '@stripe/stripe-js';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey || stripePublishableKey === 'pk_test_placeholder') {
    console.warn('Stripe publishable key is missing or is using a placeholder.');
}

export const getStripe = () => loadStripe(stripePublishableKey);
