"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { AuthButton } from "@/components/auth/auth-button"
import { authService } from "@/lib/api/authService"
import { OTPVerificationDialog } from "@/components/auth/OTP-verification-dialog"
import { getErrorMessage } from "@/lib/errorMap";
import { useAuth } from "@/context/AuthContext"

export default function SignupPage() {
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const { register } = useAuth();

    const validateEmail = (email: string) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return regex.test(email)
    }

    const validatePassword = (password: string) => {
        const regex = /^(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])(?=.*[A-Z]).{8,}$/
        return regex.test(password)
    }
    const [showOTPDialog, setShowOTPDialog] = useState(false)
    const [registeredEmail, setRegisteredEmail] = useState("")

    const handleRegister = async () => {
        setError("")
        let validationFailed = false;
        if (!formData.username.trim()) {
            setError("Vui lòng nhập username")
            return
        }
        if (!validateEmail(formData.email)) {
            setError("Email không hợp lệ")
            return
        }
        if (!validatePassword(formData.password)) {
            setError("Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số VÀ ký tự đặc biệt.")
            validationFailed = true;
            return
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Mật khẩu xác nhận không khớp")
            return
        }

        setLoading(true)
        try {
            const responseData = await register({
                username: formData.username,
                email: formData.email,
                password: formData.password,
            })
            setRegisteredEmail(formData.email)
            setShowOTPDialog(true)
        } catch (err: any) {
            if (err.httpStatus === 400) {
                setError("❌ Thông tin đăng ký không hợp lệ. Vui lòng kiểm tra lại định dạng mật khẩu, email và username.")
            } else {
                setError(getErrorMessage(err));
            }
        } finally {
            setLoading(false)
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
                            Đăng nhập →
                        </Button>
                    </Link>
                </div>

                <h2 className="text-2xl font-bold text-[#050A25] mb-5 text-center">
                    Tạo tài khoản mới
                </h2>

                <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleRegister(); }}>
                    <div>
                        <Label htmlFor="email" className="mb-2">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="Nhập email của bạn"
                            value={formData.email}
                            onChange={(e) =>
                                setFormData({ ...formData, email: e.target.value })
                            }
                        />
                    </div>
                    <div>
                        <Label htmlFor="username" className="mb-2">Username</Label>
                        <Input
                            id="username"
                            type="text"
                            placeholder="Nhập Username"
                            value={formData.username}
                            onChange={(e) =>
                                setFormData({ ...formData, username: e.target.value })
                            }
                        />
                    </div>

                    <div className="relative">
                        <Label htmlFor="password" className="mb-2">Mật khẩu</Label>
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
                            className="absolute right-4 top-8 text-gray-500"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    <div className="relative">
                        <Label htmlFor="confirmPassword" className="mb-2">Xác nhận mật khẩu</Label>
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
                            className="absolute right-4 top-8 text-gray-500"
                        >
                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    <AuthButton
                        provider="register"
                        onClick={handleRegister}
                        loading={loading}
                    />

                    {error && (
                        <p className="text-red-500 text-sm text-center mb-4">{error}</p>
                    )}


                </form>

                <p className="text-center text-sm text-gray-600 mt-6">
                    Đã có tài khoản?{" "}
                    <Link
                        href="/login"
                        className="text-[#2D55FB] hover:underline font-medium"
                    >
                        Đăng nhập ngay
                    </Link>
                </p>
            </div>
            {showOTPDialog && (
                <OTPVerificationDialog
                    email={registeredEmail}
                    onClose={() => setShowOTPDialog(false)}
                    onVerified={() => window.location.href = "/login"}
                />
            )}
        </div>

    )
}
