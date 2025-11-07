"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import React, { useState } from "react"
import { authService } from "@/lib/api/authService"
import { getErrorMessage, DEFAULT_ERROR_MESSAGE } from "@/lib/errorMap";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("")
    const [message, setMessage] = useState("")
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setStatus("loading")
        setMessage("")

        try {
            await authService.forgotPassword({ email })
            setStatus("success")
            setMessage("✅ Liên kết đặt lại mật khẩu đã được gửi đến email của bạn!")
        } catch (err: any) {
            const errMsg = getErrorMessage(err);
            setMessage(errMsg); 
            setStatus("error"); 
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
            <img
                src="/login-banner.jpg"
                alt="Background"
                className="absolute inset-0 w-full h-full object-cover blur-md scale-105"
            />
            <div className="absolute inset-0 bg-black/0" />
            <img
                className="absolute top-0 left-0 w-80 h-25 object-contain"
                src="/logo.png"
                alt="Learniverse Logo"
            />

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

                <h2 className="text-2xl font-bold text-[#050A25] mb-4 text-center">Quên mật khẩu</h2>
                <p className="text-gray-500 text-sm mb-6 text-center">
                    Nhập email để nhận liên kết đặt lại mật khẩu.
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
                        disabled={status === "loading"}
                    >
                        {status === "loading" ? "Đang gửi..." : "Gửi liên kết đặt lại"}
                    </Button>
                </form>

                {message && (
                    <p className={`text-center text-sm mt-4 ${status === "success" ? "text-green-600" : "text-red-600"}`}>
                        {message}
                    </p>
                )}

                <p className="text-center text-sm text-gray-600 mt-6">
                    Quay lại{" "}
                    <Link href="/login" className="text-[#2D55FB] hover:underline font-medium">
                        trang đăng nhập
                    </Link>
                </p>
            </div>
        </div>
    )
}
