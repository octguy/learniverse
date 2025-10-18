"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { Eye, EyeOff, Facebook, Mail } from "lucide-react"
import { useState } from "react"
import {AuthButton} from "@/components/auth/auth-button";
import * as React from "react";

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false)
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        remember: false,
    })

    return (
        <div className="min-h-screen flex">
            <div className="hidden md:block relative w-1/2">
                <img
                    src="/login-banner.jpeg"
                    alt="Modern house"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />

                <div className="absolute bottom-24 left-12 text-white">
                    <h2 className="text-6xl mb-2 italic">
                        Xin chào!
                    </h2>
                    <p className="text-3xl text-gray-200 leading-relaxed">
                        Bắt đầu hành trình học tập của bạn.
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

                    <h2 className="text-2xl font-bold text-[#050A25] mb-5">
                        Đăng nhập vào tài khoản
                    </h2>
                    <p className="text-gray-500 mb-6 text-sm"></p>

                    <form className="space-y-8">
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

                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="remember"
                                    checked={formData.remember}
                                    onCheckedChange={(val) =>
                                        setFormData({ ...formData, remember: Boolean(val) })
                                    }
                                />
                                <Label htmlFor="remember" className="text-gray-600 text-sm">
                                    Ghi nhớ tôi
                                </Label>
                            </div>

                            <Link
                                href="#"
                                className="text-sm text-[#2D55FB] hover:underline font-medium"
                            >
                                Quên mật khẩu?
                            </Link>
                        </div>

                        <AuthButton provider={"login"}/>

                        <div className="flex items-center my-6">
                            <div className="flex-grow border-t border-gray-300" />
                            <span className="mx-2 text-gray-500 text-sm">hoặc</span>
                            <div className="flex-grow border-t border-gray-300" />
                        </div>

                        <div className="space-y-4">
                            <AuthButton provider={"google"}/>
                            <AuthButton provider={"facebook"}/>
                        </div>
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
            </div>
        </div>
    )
}
