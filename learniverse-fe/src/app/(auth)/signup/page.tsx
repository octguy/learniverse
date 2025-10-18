"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { AuthButton } from "@/components/auth/auth-button"
import * as React from "react"

export default function SignupPage() {
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
    })

    return (
        <div className="min-h-screen flex">
            <div className="hidden md:block relative w-1/2">
                <img
                    src="/login-banner.jpeg"
                    alt="Learning banner"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />

                <div className="absolute bottom-24 left-12 text-white">
                    <h2 className="text-5xl mb-2 italic">Chào mừng!</h2>
                    <p className="text-2xl text-gray-200 leading-relaxed">
                        Tạo tài khoản để bắt đầu hành trình học tập của bạn.
                    </p>
                </div>

                <div className="absolute top-5 -left-10">
                    <img
                        src="/logo.png"
                        alt="Learniverse Logo"
                        className="h-25 w-auto object-contain"
                    />
                </div>
            </div>

            <div className="flex flex-col justify-center items-center w-full md:w-1/2 bg-white px-6 sm:px-12">
                <div className="w-full max-w-md">
                    {/* Header */}
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


                    <h2 className="text-2xl font-bold text-[#050A25] mb-5">
                        Tạo tài khoản mới
                    </h2>
                    <p className="text-gray-500 mb-6 text-sm">
                        Hãy nhập thông tin của bạn để đăng ký.
                    </p>

                    <form className="space-y-6">
                        <div>
                            <Label className="mb-2" htmlFor="fullName">Họ và tên</Label>
                            <Input
                                id="fullName"
                                type="text"
                                placeholder="Nhập họ và tên của bạn"
                                value={formData.fullName}
                                onChange={(e) =>
                                    setFormData({ ...formData, fullName: e.target.value })
                                }
                            />
                        </div>

                        <div>
                            <Label className="mb-2" htmlFor="email">Email</Label>
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
                            <Label className="mb-2" htmlFor="password">Mật khẩu</Label>
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
                            <Label className="mb-2" htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
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

                        <AuthButton provider={"register"} />

                        <div className="flex items-center my-6">
                            <div className="flex-grow border-t border-gray-300" />
                            <span className="mx-2 text-gray-500 text-sm">hoặc</span>
                            <div className="flex-grow border-t border-gray-300" />
                        </div>

                        <div className="space-y-4">
                            <AuthButton provider={"google"} />
                            <AuthButton provider={"facebook"} />
                        </div>
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
            </div>
        </div>
    )
}
