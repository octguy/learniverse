import { Header } from "@/components/common/header";
import { Footer } from  "@/components/common/footer";
import OnboardingDialog from "@/components/onboarding/OnboardingDialog";
export default function MainLayout({ children }: { children: React.ReactNode }) {

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <OnboardingDialog />
            <div className="flex">
                <main className="flex-1 lg:ml-64 pt-[96px] p-4 sm:p-6">

                    {children} 
                </main>
            </div>
        </div>
    );
}