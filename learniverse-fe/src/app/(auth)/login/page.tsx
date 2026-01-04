"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { OTPVerificationDialog } from "@/components/auth/OTP-verification-dialog"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { AuthButton } from "@/components/auth/auth-button"
import { authService } from "@/lib/api/authService"
import {getErrorMessage, DEFAULT_ERROR_MESSAGE, AUTH_ERROR_MESSAGES} from "@/lib/errorMap";
import { useAuth } from "@/context/AuthContext"

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false)
    const [showOTPDialog, setShowOTPDialog] = useState(false)
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        remember: false,
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const { login } = useAuth();

    const [isUnverifiedUser, setIsUnverifiedUser] = useState(false)
    const validateEmail = (email: string) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return regex.test(email)
    }

    const handleLogin = async () => {
        setError("");
        if (!formData.email || !formData.password) {
            setError("Vui lòng nhập đầy đủ email và mật khẩu.");
            return;
        }

        if (!validateEmail(formData.email)) {
            setError("Email không hợp lệ.");
            return;
        }

        setLoading(true);
        try {
            const apiResponse = await authService.login(formData);
            const user = await login(apiResponse.data);
            
            if (user.roles?.includes('ROLE_ADMIN') || user.role === 'ROLE_ADMIN') {
                window.location.href = "/admin/dashboard";
            } else {
                window.location.href = "/home";
            }
        } catch (err: any) {
            let errMsg = getErrorMessage(err);
            const isUnverified = err.httpStatus === 403 || err.errorCode === "EMAIL_NOT_VERIFIED";

            if (isUnverified) {
                errMsg = AUTH_ERROR_MESSAGES.USER_NOT_VERIFIED;
                setIsUnverifiedUser(true);
                setShowOTPDialog(true);
            }
            setError(errMsg);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
            <img
                src="/login-banner.jpg"
                alt="Background"
                className="absolute inset-0 w-full h-full object-cover blur-md scale-105"
            />
            <div className="absolute inset-0 bg-black/0" />
            <img className="absolute top-0 left-0 w-80 h-25" src="/logo.png" />

            <div className="relative z-10 bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl p-6 w-full max-w-md mx-auto">
                <div className="flex justify-end mb-6">
                    <Link href="/signup">
                        <Button
                            variant="outline"
                            className="rounded-full px-6 py-2 text-sm border-black text-black hover:bg-gray-100"
                        >
                            Đăng ký →
                        </Button>
                    </Link>
                </div>

                <h2 className="text-2xl font-bold text-[#050A25] mb-5 text-center">
                    Đăng nhập vào tài khoản
                </h2>


                <form
                    className="space-y-8"
                    onSubmit={(e) => {
                        e.preventDefault()
                        handleLogin()
                    }}
                >
                    <div>
                        <Label className="mb-2" htmlFor="email">
                            Email
                        </Label>
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

                    <div className="relative">
                        <Label className="mb-2" htmlFor="password">
                            Mật khẩu
                        </Label>
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

                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">

                            <Label htmlFor="remember" className="text-gray-600 text-sm">

                            </Label>
                        </div>

                        <Link
                            href="/forget-password"
                            className="text-sm text-[#2D55FB] hover:underline font-medium"
                        >
                            Quên mật khẩu?
                        </Link>
                    </div>

                    <AuthButton
                        provider={"login"}
                        onClick={handleLogin}
                        loading={loading}
                    />

                    {error && (
                        <p className="text-red-500 text-sm mb-4 text-center">
                            {error}
                            {error === AUTH_ERROR_MESSAGES.USER_NOT_VERIFIED && (
                                <Button
                                    variant="link"
                                    onClick={() => setShowOTPDialog(true)}
                                    className="p-0 h-auto ml-1 text-sm text-red-500 underline"
                                >
                                    Xác thực ngay
                                </Button>
                            )}
                        </p>
                    )}


                </form>

                <p className="text-center text-sm text-gray-600 mt-6">
                    Chưa có tài khoản?{" "}
                    <Link
                        href="/signup"
                        className="text-[#2D55FB] hover:underline font-medium"
                    >
                        Đăng ký ngay
                    </Link>
                </p>
            </div>
            {showOTPDialog && formData.email && (
                <OTPVerificationDialog
                    email={formData.email}
                    onClose={() => setShowOTPDialog(false)}
                    onVerified={() => window.location.href = "/"}
                />
            )}
        </div>
    )
}
