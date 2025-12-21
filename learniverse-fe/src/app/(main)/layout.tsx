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
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <Header />
      <OnboardingDialog />
      <div className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl overflow-hidden">
        <div className="flex gap-6 mt-6 h-full">
          <SideBar />
          <main className="flex-1 min-w-0 overflow-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}
