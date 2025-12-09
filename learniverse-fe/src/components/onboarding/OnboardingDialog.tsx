// File: src/components/onboarding/OnboardingDialog.tsx
"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import WelcomeStep from "./WelcomeStep"
import Step2 from "./Step2"
import Step4 from "./Step4"
import { TagSelector } from "@/components/auth/tag-selector"
import { userProfileService } from "@/lib/api/userProfileService"
import { UpdateProfileRequest, UserTag } from "@/types/userProfile" // Import UserTag

export default function OnboardingDialog({ user }: { user: any }) {
    const [open, setOpen] = useState(false)
    const [step, setStep] = useState(0)
    const [loading, setLoading] = useState(false)

    const [allTags, setAllTags] = useState<UserTag[]>([])

    const [formData, setFormData] = useState<{
        purpose: string;
        favoriteTags: string[];
        improveTags: string[];
    }>({
        purpose: "",
        favoriteTags: [],
        improveTags: [],
    })

    useEffect(() => {
        if (user && !user.onboardingCompleted) {
            setOpen(true)
            const fetchTags = async () => {
                try {
                    const tags = await userProfileService.getAllUserTags();
                    setAllTags(tags);
                } catch (e) {
                    console.error("Failed to fetch tags", e);
                }
            };
            fetchTags();
        }
    }, [user])

    const nextStep = () => setStep((s) => s + 1)
    const prevStep = () => setStep((s) => Math.max(s - 1, 0))

    const handleFinish = async () => {
        setLoading(true)
        try {
            const tags = Array.from(new Set([...formData.favoriteTags, ...formData.improveTags]));
            const payload: UpdateProfileRequest = {
                displayName: user.username,
                bio: `Mục đích tham gia: ${formData.purpose}`,
                userTags: tags,
            }

            await userProfileService.onboardProfile(payload)
            setOpen(false)
            window.location.reload()
        } catch (error) {
            console.error("Onboarding error:", error)
            alert("Có lỗi xảy ra, vui lòng thử lại.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={() => {}}>
            <DialogTitle className="hidden">Onboarding</DialogTitle>
            <DialogContent className="min-w-[1000px] max-w-[1000px] p-0 bg-transparent shadow-none border-none overflow-hidden [&>button]:hidden">

                {step === 0 && <WelcomeStep onNext={nextStep} />}

                {step === 1 && (
                    <Step2
                        selectedValue={formData.purpose}
                        onChange={(val) => setFormData({ ...formData, purpose: val })}
                        onNext={nextStep}
                        onPrev={prevStep}
                    />
                )}

                {step === 2 && (
                    <TagSelector
                        mode="onboarding"
                        selectedTags={formData.favoriteTags}
                        onChange={(tags) => setFormData({ ...formData, favoriteTags: tags })}
                        onNext={nextStep}
                        onPrev={prevStep}
                        availableTags={allTags}
                    />
                )}

                {step === 3 && (
                    <Step4
                        selectedTags={formData.improveTags}
                        onChange={(tags) => setFormData({ ...formData, improveTags: tags })}
                        onFinish={handleFinish}
                        onPrev={prevStep}
                        availableTags={allTags}
                    />
                )}
            </DialogContent>
        </Dialog>
    )
}