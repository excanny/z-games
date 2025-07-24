// const Paystack = require("paystack-api")(process.env.PAYSTACK_SECRET);

// class PaymentUseCase {
//     async initiatePayment(email, amount) {
//         const response = await Paystack.transaction.initialize({
//             email,
//             amount: amount * 100, // Convert to kobo
//             currency: "NGN",
//         });
//         return response.data;
//     }
// }

// module.exports = PaymentUseCase;
