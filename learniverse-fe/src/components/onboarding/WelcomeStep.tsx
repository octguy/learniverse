"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"

interface WelcomeStepProps {
    onNext?: () => void
}

export default function WelcomeOnboardingPage({ onNext }: WelcomeStepProps) {
    return (
            <div
                className="
                    bg-white rounded-2xl overflow-hidden
                    flex flex-col md:flex-row
                    border border-gray-200
                    w-full max-w-[1250px]
                    min-h-[60vh] lg:min-h-[50vh] xl:min-h-[45vh] 2xl:min-h-[40vh]
                    transition-all duration-300
                    "
            >
                {/* Left Section */}
                <div className="flex-1 p-8 sm:p-12 flex flex-col items-center text-center space-y-6 sm:space-y-12">
                    {/* Greeting */}
                    <div className="w-full">
                        <p className="text-gray-600 italic mb-5 text-left text-base sm:text-lg">
                            Xin chào <span className="font-semibold text-[#2D55FB]">Khải</span>!
                        </p>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                            Welcome to <span className="text-[#2D55FB]">Learniverse</span>!
                        </h1>
                    </div>

                    {/* Logo + Caption */}
                    <div className="flex flex-col items-center space-y-4">
                        <Image
                            src="/logo.png"
                            alt="Learniverse Logo"
                            width={400}
                            height={400}
                            className="object-contain w-[340px] sm:w-[380px] md:w-[400px] lg:w-[420px]"
                        />
                        <p className="text-gray-500 text-sm sm:text-base">
                            Hành trình học tập mới bắt đầu!
                        </p>
                    </div>

                    {/* Action */}
                    <Button
                        className="
                            rounded bg-[#2D55FB] hover:bg-[#1b3de0]
                            text-white font-medium
                            text-base sm:text-lg
                            px-10 sm:px-12 py-3 sm:py-3.5
                            shadow-md hover:shadow-lg transition-all
                            "
                        onClick={onNext}
                    >
                        Bắt đầu
                    </Button>
                </div>

                {/* Right Section */}
                <div className="hidden md:block flex-1 relative">
                    <Image
                        src="/onboarding-banner.jpeg"
                        alt="Welcome Illustration"
                        fill
                        className="object-cover opacity-95"
                        priority
                    />
                    <div className="absolute top-6 right-6">
                        <Image
                            src="/logo.png"
                            alt="Learniverse Mini Logo"
                            width={130}
                            height={40}
                            className="object-contain"
                        />
                    </div>
                </div>
            </div>

    )
}
