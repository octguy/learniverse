"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from "@/components/ui/input-otp"
import {authService} from "@/lib/api/authService";
import { getErrorMessage, DEFAULT_ERROR_MESSAGE } from "@/lib/errorMap";
import {cn} from "@/lib/utils";

interface OTPDialogProps {
    email: string
    onClose: () => void
    onVerified?: () => void
}

export function OTPVerificationDialog({ email, onClose, onVerified }: OTPDialogProps) {
    const [otp, setOtp] = useState("")
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState("")

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault()
        setMessage("");
        if (otp.length < 6) {
            setMessage("❌ Vui lòng nhập đủ 6 số OTP.")
            return
        }
        setLoading(true)
        setMessage("")

        try {
            const code = (otp || "").replace(/-/g, "").trim(); // null-safe
            console.log("Sending OTP:", code);

            await authService.verifyUser({ email, verificationCode: code });
            setMessage("✅ Xác thực thành công! Đang chuyển hướng...");
            setTimeout(() => (window.location.href = "/login"), 1500);
        } catch (err: any) {
            setMessage(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }

    const handleResendOTP = async () => {
        setLoading(true)
        setMessage("Đang gửi lại mã OTP...")
        try {
            await authService.resendVerificationCode(email)
            setMessage("✅ Mã OTP mới đã được gửi đến email của bạn.")
        } catch (err: any) {
            setMessage(getErrorMessage(err));
        } finally {
            setLoading(false)
        }
    }

    const isError = message.includes("lỗi") ||
        message.includes("hạn") ||
        message.includes("tồn tại") ||
        message.includes("sai") ||
        message.includes("thất bại") ||
        message.includes("❌") ||
        message.includes("hợp lệ") ||
        message.includes("quyền");

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md relative">
                <h3 className="text-xl font-bold mb-4">Xác thực email</h3>
                <p className="text-sm mb-4">Mã OTP đã được gửi đến <strong>{email}</strong></p>

                <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}
                    containerClassName="justify-center mb-4"
                >
                    <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                    </InputOTPGroup>
                </InputOTP>

                {message && (
                    <p className={cn(
                        "text-sm mb-4 text-center",
                        isError ? "text-red-500" : "text-green-600"
                    )}>
                        {message}
                    </p>
                )}

                <div className="flex justify-between items-center">
                    <Button onClick={onClose} variant="outline" className="px-4 py-2">Hủy</Button>
                    <div className="flex gap-2">
                        <Button onClick={handleResendOTP} variant="ghost" className="px-4 py-2">Gửi lại OTP</Button>
                        <Button onClick={handleVerify} className="px-4 py-2" disabled={loading}>
                            {loading ? "Đang xác thực..." : "Xác nhận"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
