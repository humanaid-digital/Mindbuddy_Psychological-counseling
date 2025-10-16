const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const { auth } = require('../middleware/auth');
const logger = require('../utils/logger');

// 결제 생성 (임시)
router.post('/', auth, async (req, res) => {
    try {
        const { counselorId, date, time, method, paymentMethod, amount } = req.body;

        // 예약 생성
        const booking = new Booking({
            client: req.user.id,
            counselor: counselorId,
            date: new Date(date),
            time: time,
            method: method,
            status: 'pending'
        });

        await booking.save();

        // 결제 생성
        const payment = new Payment({
            booking: booking._id,
            user: req.user.id,
            amount: amount,
            method: paymentMethod,
            status: 'completed',
            transactionId: `TEMP_${Date.now()}`
        });

        await payment.save();

        // 예약 상태 업데이트
        booking.status = 'confirmed';
        booking.payment = payment._id;
        await booking.save();

        logger.info(`결제 완료: ${req.user.id} - ${amount}원`);

        res.json({
            success: true,
            message: '결제가 완료되었습니다.',
            data: {
                bookingId: booking._id,
                paymentId: payment._id
            }
        });

    } catch (error) {
        logger.error('결제 처리 오류:', error);
        res.status(500).json({
            success: false,
            message: '결제 처리 중 오류가 발생했습니다.'
        });
    }
});

// 결제 내역 조회
router.get('/', auth, async (req, res) => {
    try {
        const payments = await Payment.find({ user: req.user.id })
            .populate('booking')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: payments
        });

    } catch (error) {
        logger.error('결제 내역 조회 오류:', error);
        res.status(500).json({
            success: false,
            message: '결제 내역 조회 중 오류가 발생했습니다.'
        });
    }
});

module.exports = router;
