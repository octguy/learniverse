"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Step2Props {
  onNext?: () => void
  onPrev?: () => void
}

const purposes = [
  {
    id: "study",
    title: "Học tập",
    image: "/onboarding/study.png",
  },
  {
    id: "friends",
    title: "Kết bạn",
    image: "/onboarding/friends.png",
  },
  {
    id: "personal",
    title: "Mục đích cá nhân",
    image: "/onboarding/personal.png",
  },
]

export default function Step2({ onNext, onPrev }: Step2Props) {
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <div
      className="flex flex-col justify-between bg-gradient-to-b from-[#f6f6ff] to-white
                 w-full max-w-[1250px] h-full min-h-[70vh] rounded-xl p-10 relative"
    >
      {/* === Header === */}
      <div className="flex justify-between items-start">
        <h1 className="text-3xl sm:text-4xl font-semibold text-gray-800">
          Bạn sử dụng{" "}
          <span className="text-[#2D55FB] font-bold">Learniverse</span> để làm gì?
        </h1>
        <Image
          src="/logo.png"
          alt="Learniverse Logo"
          width={140}
          height={40}
          className="object-contain"
        />
      </div>

      {/* === Content === */}
      <div className="flex flex-1 items-center justify-center mt-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 w-full max-w-4xl justify-items-center">
          {purposes.map((item) => {
            const isSelected = selected === item.id
            return (
              <div
                key={item.id}
                onClick={() => setSelected(item.id)}
                className={cn(
                  "w-[230px] sm:w-[250px] cursor-pointer rounded-lg border transition-all overflow-hidden shadow-sm hover:shadow-md flex flex-col",
                  isSelected
                    ? "border-blue-500 ring-2 ring-blue-400 bg-blue-50"
                    : "border-gray-200 bg-white hover:bg-gray-50"
                )}
              >
                <div className="flex-1 bg-gray-50 flex items-center justify-center p-5">
                  <Image
                    src={item.image}
                    alt={item.title}
                    width={180}
                    height={180}
                    className="object-contain"
                  />
                </div>
                <div className="text-center py-3 font-medium text-gray-700 bg-gray-100">
                  {item.title}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* === Footer === */}
      <div className="flex justify-end gap-4 mt-10">
        <Button
          variant="outline"
          className="bg-white border-blue-500 text-blue-500 hover:bg-blue-50 rounded"
          onClick={onPrev}
        >
          ← Quay lại
        </Button>
        <Button
          className={cn(
            "bg-blue-500 hover:bg-blue-600 text-white rounded px-4 py-2",
            !selected && "opacity-50 cursor-not-allowed"
          )}
          disabled={!selected}
          onClick={onNext}
        >
          Tiếp tục →
        </Button>
      </div>
    </div>
  )
}
