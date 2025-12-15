"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import WelcomeStep from "./WelcomeStep"
import Step2 from "./Step2"
import Step3 from "./Step3"
import Step4 from "./Step4"
import { userProfileService } from "@/lib/api/userProfileService"
import { UpdateProfileRequest } from "@/types/userProfile"
import { UserTag } from "@/types/userTag"
import { useAuth } from "@/context/AuthContext"

export default function OnboardingDialog() {
    const { user, completeOnboarding } = useAuth();
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
        if (user && !user.isOnboarded) {
            setOpen(true);
            // Tải danh sách tags ngay khi mở dialog
            const fetchTags = async () => {
                try {
                    const tags = await userProfileService.getAllUserTags();
                    setAllTags(tags);
                } catch (e) {
                    console.error("Failed to fetch tags", e);
                }
            };
            fetchTags();
        } else {
            setOpen(false);
        }
    }, [user]);

    const nextStep = () => setStep((s) => s + 1)
    const prevStep = () => setStep((s) => Math.max(s - 1, 0))

    const handleFinish = async () => {
        setLoading(true)
        try {
            const payload: UpdateProfileRequest = {
                displayName: user?.username || "Người dùng mới",
                bio: `Mục đích tham gia: ${formData.purpose}`,
                interestTagIds: formData.favoriteTags,
                skillTagIds: formData.improveTags,
            }
            console.log("Submitting onboarding data:", payload);

            await userProfileService.onboardProfile(payload)

            completeOnboarding();
            setOpen(false);

        } catch (error) {
            console.error("Onboarding error:", error)
            alert("Có lỗi xảy ra khi lưu thông tin. Vui lòng thử lại.")
        } finally {
            setLoading(false)
        }
    }

    if (!open) return null;

    return (
        <Dialog open={open} onOpenChange={() => {  }}>
            <DialogTitle className="hidden">Chào mừng bạn đến với Learniverse</DialogTitle>
            <DialogContent
                className="min-w-[95vw] md:min-w-[1000px] max-w-[1000px] p-0 bg-transparent shadow-none border-none overflow-hidden [&>button]:hidden focus:outline-none"
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
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
                    <Step3
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