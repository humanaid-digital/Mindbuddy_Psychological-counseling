const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');

// 이메일 전송 설정
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// 문의하기 API
router.post('/', [
    body('name').trim().notEmpty().withMessage('이름을 입력해주세요'),
    body('email').isEmail().withMessage('올바른 이메일 주소를 입력해주세요'),
    body('category').notEmpty().withMessage('문의 유형을 선택해주세요'),
    body('subject').trim().notEmpty().withMessage('제목을 입력해주세요'),
    body('message').trim().notEmpty().withMessage('문의 내용을 입력해주세요')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: errors.array()[0].msg
            });
        }

        const { name, email, phone, category, subject, message } = req.body;

        // 문의 유형 한글 변환
        const categoryMap = {
            'service': '서비스 이용 문의',
            'counselor': '상담사 등록 문의',
            'payment': '결제 관련 문의',
            'technical': '기술 지원',
            'partnership': '제휴 문의',
            'other': '기타'
        };

        // 이메일 내용 구성
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.CONTACT_EMAIL || process.env.EMAIL_USER,
            subject: `[마인드버디 문의] ${subject}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #6366f1;">새로운 문의가 도착했습니다</h2>
                    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>이름:</strong> ${name}</p>
                        <p><strong>이메일:</strong> ${email}</p>
                        ${phone ? `<p><strong>연락처:</strong> ${phone}</p>` : ''}
                        <p><strong>문의 유형:</strong> ${categoryMap[category] || category}</p>
                        <p><strong>제목:</strong> ${subject}</p>
                    </div>
                    <div style="background: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                        <h3 style="color: #1e293b; margin-top: 0;">문의 내용</h3>
                        <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
                    </div>
                    <div style="margin-top: 20px; padding: 15px; background: #f0f4ff; border-radius: 8px;">
                        <p style="margin: 0; font-size: 14px; color: #64748b;">
                            이 메일은 마인드버디 문의하기 페이지를 통해 자동으로 발송되었습니다.
                        </p>
                    </div>
                </div>
            `
        };

        // 이메일 전송
        await transporter.sendMail(mailOptions);

        logger.info(`문의 접수: ${email} - ${subject}`);

        res.json({
            success: true,
            message: '문의가 성공적으로 전송되었습니다.'
        });

    } catch (error) {
        logger.error('문의 전송 오류:', error);
        res.status(500).json({
            success: false,
            message: '문의 전송 중 오류가 발생했습니다.'
        });
    }
});

module.exports = router;
