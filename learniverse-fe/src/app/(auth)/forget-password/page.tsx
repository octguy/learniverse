"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import * as React from "react"
import { useState } from "react"

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("")
    const [isSent, setIsSent] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // Giả lập gửi email
        setIsSent(true)
        setTimeout(() => setIsSent(false), 3000)
    }

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Background image */}
            <img
                src="/login-banner.jpg"
                alt="Background"
                className="absolute inset-0 w-full h-full object-cover blur-md scale-105"
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/0" />

            {/* Logo */}
            <img
                className="absolute top-0 left-0 w-80 h-25 object-contain"
                src="/logo.png"
                alt="Learniverse Logo"
            />

            {/* Centered form card */}
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

                <h2 className="text-2xl font-bold text-[#050A25] mb-4 text-center">
                    Quên mật khẩu
                </h2>
                <p className="text-gray-500 text-sm mb-6 text-center">
                    Nhập địa chỉ email để nhận liên kết đặt lại mật khẩu.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <Label htmlFor="email" className="mb-2">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="Nhập email của bạn"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full rounded-full bg-[#2D55FB] hover:bg-[#1b3de0] text-white font-medium py-2"
                    >
                        Gửi liên kết đặt lại
                    </Button>
                </form>

                {isSent && (
                    <p className="text-green-600 text-sm text-center mt-4">
                        Liên kết đặt lại đã được gửi đến email của bạn!
                    </p>
                )}

                <p className="text-center text-sm text-gray-600 mt-6">
                    Quay lại{" "}
                    <Link
                        href="/login"
                        className="text-[#2D55FB] hover:underline font-medium"
                    >
                        trang đăng nhập
                    </Link>
                </p>
            </div>
        </div>
    )
}
