import { Header } from "@/components/common/header";
import { Footer } from "@/components/common/footer";
import OnboardingDialog from "@/components/onboarding/OnboardingDialog";
import { SideBar } from "@/components/common/sidebar";
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <OnboardingDialog />
      <div className="flex-1 w-full px-4 sm:px-6 lg:px-8">
        <div className="flex gap-6 mt-6 items-start">
          <div className="sticky top-20 h-fit shrink-0">
            <SideBar />
          </div>
          <main className="flex-1 min-w-0 pb-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
