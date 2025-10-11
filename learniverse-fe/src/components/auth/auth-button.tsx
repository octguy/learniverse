"use client"

import { Button } from "@/components/ui/button"
import { FcGoogle } from "react-icons/fc"
import { FaFacebook } from "react-icons/fa"
import { LogInIcon, Mail } from "lucide-react"

type AuthProvider = "google" | "facebook" | "logout" | "login" | "register"

interface AuthButtonProps {
    provider: AuthProvider
    onClick?: () => void
    loading?: boolean
}

export function AuthButton({ provider, onClick, loading }: AuthButtonProps) {
    const renderIcon = () => {
        switch (provider) {
            case "google":
                return <FcGoogle className="size-5" />
            case "facebook":
                return <FaFacebook className="text-[#1877F2] size-5" />
            case "login":
                return <LogInIcon className="size-5 text-white" />
        }
    }

    const getLabel = () => {
        switch (provider) {
            case "google":
                return "Đăng nhập với Google"
            case "facebook":
                return "Đăng nhập với Facebook"
            case "logout":
                return "Đăng xuất"
            case "login":
                return "Đăng nhập"
            case "register":
                return "Tạo tài khoản"
        }
    }

    const baseStyle =
        "w-full justify-center gap-2 py-5 text-[15px] font-medium rounded-lg transition"

    const providerStyle = {
        google: "bg-[#E8F1FF] text-[#1877F2] hover:bg-[#d9e7ff]",
        facebook: "bg-[#E8F1FF] text-[#1877F2] hover:bg-[#d9e7ff]",
        login: "bg-[#1677FF] text-white hover:bg-[#0f5ed7]",
        register: "bg-[#1677FF] text-white hover:bg-[#0f5ed7]",
        logout: "bg-[#E8F1FF] text-[#1877F2] hover:bg-[#d9e7ff]",
    }

    return (
        <Button
            disabled={loading}
            onClick={onClick}
            className={`${baseStyle} ${providerStyle[provider] || ""}`}
        >
            {renderIcon()}
            <span>{loading ? "Đang xử lý..." : getLabel()}</span>
        </Button>
    )
}
