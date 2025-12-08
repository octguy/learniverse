import { Header } from "@/components/common/header";
import { Footer } from  "@/components/common/footer";
import { SideBar } from "@/components/common/sidebar";
export default function MainLayout({ children }: { children: React.ReactNode }) {

    return (
        <div className="min-h-screen bg-gray-50">
            <Header /> 
            <div className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex gap-6 mt-6">
          <SideBar />
          <main className="flex-1 min-w-0 pb-10">
            {children}
          </main>
        </div>
      </div>
        </div>
    );
}