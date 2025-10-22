"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import Link from "next/link"

// import OTP component bạn vừa tạo
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
    InputOTPSeparator,
} from "@/components/ui/input-otp"

export default function VerifyEmailPage() {
    const searchParams = useSearchParams()
    const email = searchParams.get("email") || ""
    const [otp, setOtp] = useState("")
    const [message, setMessage] = useState("")
    const [loading, setLoading] = useState(false)

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault()
        if (otp.length < 6) {
            setMessage("❌ Vui lòng nhập đủ 6 số OTP.")
            return
        }
        setLoading(true)
        setMessage("")

        try {
            const res = await fetch("/api/auth/verify-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp }),
            })

            if (res.ok) {
                setMessage("Xác thực thành công! Đang chuyển hướng...")
                setTimeout(() => (window.location.href = "/login"), 1500)
            } else {
                setMessage("❌ Mã OTP không hợp lệ hoặc đã hết hạn.")
            }
        } catch {
            setMessage("❌ Có lỗi xảy ra. Vui lòng thử lại.")
        } finally {
            setLoading(false)
        }
    }

    const handleResendOTP = async () => {
        setLoading(true)
        setMessage("Đang gửi lại mã OTP...")
        try {
            const res = await fetch("/api/auth/resend-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            })
            if (res.ok) setMessage("Mã OTP mới đã được gửi đến email của bạn.")
            else setMessage("❌ Không thể gửi lại OTP. Vui lòng thử lại sau.")
        } catch {
            setMessage("❌ Có lỗi xảy ra.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Background */}
            <img
                src="/login-banner.jpg"
                alt="Background"
                className="absolute inset-0 w-full h-full object-cover blur-md scale-105"
            />
            <div className="absolute inset-0 bg-black/0" />

            {/* Logo */}
            <img
                className="absolute top-0 left-0 w-80 h-25 object-contain"
                src="/logo.png"
                alt="Learniverse Logo"
            />

            {/* Card */}
            <div className="relative z-10 bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl p-6 w-full max-w-md mx-auto">
                <div className="flex justify-end mb-6">
                    <Link href="/login">
                        <Button
                            variant="outline"
                            className="rounded-full px-6 py-2 text-sm border-black text-black hover:bg-gray-100"
                        >
                            ← Đăng nhập
                        </Button>
                    </Link>
                </div>

                <h2 className="text-2xl font-bold text-[#050A25] mb-5 text-center">
                    Xác thực email của bạn
                </h2>

                <p className="text-center text-gray-600 mb-6">
                    Mã OTP đã được gửi đến:{" "}
                    <span className="font-semibold text-[#2D55FB]">{email}</span>
                </p>

                {/* OTP Form */}
                <form onSubmit={handleVerify} className="space-y-6">
                    <div className="flex flex-col items-center">
                        <Label htmlFor="otp" className="mb-3 text-base">
                            Nhập mã OTP gồm 6 số
                        </Label>

                        <InputOTP
                            maxLength={6}
                            value={otp}
                            onChange={(value) => setOtp(value)}
                            containerClassName="justify-center"
                            className="focus:ring-2 focus:ring-[#2D55FB]"
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
                    </div>

                    <Button
                        type="submit"
                        className="w-full rounded-full bg-[#2D55FB] hover:bg-[#1b3de0] text-white font-medium py-2"
                        disabled={loading}
                    >
                        {loading ? "Đang xác thực..." : "Xác nhận"}
                    </Button>

                    <p className="text-center text-sm text-gray-600">
                        Không nhận được mã?{" "}
                        <button
                            type="button"
                            onClick={handleResendOTP}
                            className="text-[#2D55FB] hover:underline font-medium"
                            disabled={loading}
                        >
                            Gửi lại
                        </button>
                    </p>
                </form>

                {message && (
                    <p className="text-center text-sm mt-4 text-gray-700">{message}</p>
                )}
            </div>
        </div>
    )
}
