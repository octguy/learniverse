"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"
import * as React from "react"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"

export default function ResetPasswordPage() {
    const searchParams = useSearchParams()
    const token = searchParams.get("token") // 🔒 Token lấy từ URL (VD: /reset-password?token=abc123)
    const [isValidToken, setIsValidToken] = useState<boolean | null>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [formData, setFormData] = useState({
        password: "",
        confirmPassword: "",
    })
    const [message, setMessage] = useState("")


    useEffect(() => {
        async function verifyToken() {
            if (!token) {
                setIsValidToken(true)
                return
            }
            try {
                // Gọi API kiểm tra token
                const res = await fetch(`/api/auth/verify-reset-token?token=${token}`)
                if (res.ok) setIsValidToken(true)
                else setIsValidToken(false)
            } catch {
                setIsValidToken(false)
            }
        }
        verifyToken()
    }, [token])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (formData.password !== formData.confirmPassword) {
            setMessage("❌ Mật khẩu không khớp!")
            return
        }

        const res = await fetch("/api/auth/reset-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, newPassword: formData.password }),
        })

        if (res.ok) {
            setMessage("✅ Mật khẩu đã được đặt lại thành công!")
        } else {
            setMessage("❌ Liên kết không hợp lệ hoặc đã hết hạn.")
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

                {isValidToken === false && (
                    <p className="text-red-600 text-center font-medium">
                        ❌ Liên kết không hợp lệ hoặc đã hết hạn.
                    </p>
                )}

                {isValidToken === null && (
                    <p className="text-gray-500 text-center">Đang xác minh liên kết...</p>
                )}

                {isValidToken && (
                    <>
                        <h2 className="text-2xl font-bold text-[#050A25] mb-5 text-center">
                            Đặt lại mật khẩu
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="relative">
                                <Label htmlFor="password" className="mb-2 block">Mật khẩu mới</Label>
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) =>
                                        setFormData({ ...formData, password: e.target.value })
                                    }
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-8 text-gray-500"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            <div className="relative">
                                <Label htmlFor="confirmPassword" className="mb-2 block">Xác nhận mật khẩu</Label>
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={(e) =>
                                        setFormData({ ...formData, confirmPassword: e.target.value })
                                    }
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-8 text-gray-500"
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            <Button
                                type="submit"
                                className="w-full rounded-full bg-[#2D55FB] hover:bg-[#1b3de0] text-white font-medium py-2"
                            >
                                Cập nhật mật khẩu
                            </Button>
                        </form>

                        {message && (
                            <p className="text-center text-sm mt-4 text-gray-700">{message}</p>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
