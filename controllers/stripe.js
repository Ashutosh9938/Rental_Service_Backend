const stripe = require('stripe')(process.env.STRIPE_KEY);

const createPaymentIntent = async (req, res) => {
  const { amount } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Stripe expects amount in cents
      currency: 'usd',
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      dpmCheckerLink: paymentIntent.dpm_checker_link, // Include this if you're using 3D Secure
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { createPaymentIntent };