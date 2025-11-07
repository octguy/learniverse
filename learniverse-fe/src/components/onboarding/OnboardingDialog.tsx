"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import WelcomeStep from "./WelcomeStep"
import Step2 from "./Step2"
import Step3 from "./Step3"
import Step4 from "./Step4"

export default function OnboardingDialog({ user }: { user: any }) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  const [selectedTags, setSelectedTags] = useState<string[]>([])

  useEffect(() => {
    if (!user?.onboardingCompleted) {
      setOpen(true)
    }
  }, [user])

  const nextStep = () => setStep((s) => s + 1)
  const prevStep = () => setStep((s) => Math.max(s - 1, 0))
  const finish = () => {
    console.log("Hoàn tất onboarding với tags:", selectedTags)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogHeader>
        <DialogTitle></DialogTitle>
      </DialogHeader>

      <DialogContent
        className={`min-w-[1000px] max-w-[1000px] p-0 bg-transparent
          shadow-none border-none overflow-hidden
          [&>button]:hidden
          [&_[data-radix-dialog-close]]:hidden
          [&_[data-dialog-close]]:hidden`}
      >
        {step === 0 && <WelcomeStep onNext={nextStep} />}
        {step === 1 && <Step2 onNext={nextStep} onPrev={prevStep} />}
        {step === 2 && <Step3 onNext={nextStep} onPrev={prevStep} />}

        {step === 3 && (
          <Step4
            selectedTags={selectedTags}
            onChange={setSelectedTags}
            onFinish={finish}
            onPrev={prevStep}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
