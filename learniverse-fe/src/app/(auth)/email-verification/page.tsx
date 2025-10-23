"use client"

import React, { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
    InputOTPSeparator,
} from "@/components/ui/input-otp"
import { authService } from "@/lib/api/authService"
import {OTPVerificationDialog} from "@/components/auth/OTP-verification-dialog";

export default function VerifyEmailPage() {
    const searchParams = useSearchParams()
    const email = searchParams.get("email") || ""
    const [otp, setOtp] = useState("")
    const [message, setMessage] = useState("")
    const [loading, setLoading] = useState(false)
    const [showDialog, setShowDialog] = useState(true)

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

                <OTPVerificationDialog email={email}
                                       onClose={() => setShowDialog(false)}
                                       onVerified={() => {
                    window.location.href = "/login"
                }}/>

                {message && (
                    <p className="text-center text-sm mt-4 text-gray-700">{message}</p>
                )}
            </div>
        </div>
    )
}
