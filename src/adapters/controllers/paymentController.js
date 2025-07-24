// class PaymentController {
//     constructor(paymentUseCase) {
//         this.paymentUseCase = paymentUseCase;
//     }

//     async pay(req, res) {
//         try {
//             const response = await this.paymentUseCase.initiatePayment(req.body.email, req.body.amount);
//             res.json(response);
//         } catch (error) {
//             res.status(500).json({ message: "Payment failed" });
//         }
//     }
// }

// module.exports = PaymentController;
