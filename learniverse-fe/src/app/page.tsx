import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, MessageCircle, TrendingUp } from "lucide-react";
import { Footer } from "@/components/common/footer";
import WelcomeOnboarding from "@/components/onboarding/WelcomeStep"
import OnboardingDialog from "@/components/onboarding/OnboardingDialog";
export default function Home() {
  const user = {
    name: "Khải",
    onboardingCompleted: false,
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">L</span>
              </div>
              <span className="text-2xl font-bold text-primary">Learniverse</span>
            </div>
            <div className="flex space-x-4">
              <Button variant="outline" asChild>
                <a href="/login">Đăng nhập</a>
              </Button>
              <Button asChild>
                <a href="/signup">Đăng ký</a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Kết nối và học tập cùng nhau
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Learniverse là nền tảng học tập xã hội giúp sinh viên và người học kết nối, 
            chia sẻ kiến thức và cùng nhau phát triển trong hành trình học tập.
          </p>
          <div className="flex justify-center space-x-4">
            <Button size="lg" asChild>
              <a href="/signup">Bắt đầu ngay</a>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="/login">Đăng nhập</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Tính năng nổi bật
            </h2>
            <p className="text-lg text-gray-600">
              Khám phá những tính năng giúp bạn học tập hiệu quả hơn
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle>Chia sẻ kiến thức</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Tạo và chia sẻ bài viết học thuật với công thức toán học, hình ảnh và tài liệu đính kèm
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle>Hỏi & Đáp</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Đặt câu hỏi và nhận câu trả lời chất lượng từ cộng đồng học tập
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle>Nhóm học tập</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Tham gia hoặc tạo nhóm học tập theo chủ đề, môn học yêu thích
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <CardTitle>Theo dõi xu hướng</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Khám phá các chủ đề thịnh hành và nội dung được quan tâm nhất
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Sẵn sàng bắt đầu hành trình học tập?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Tham gia cộng đồng Learniverse ngay hôm nay và khám phá thế giới kiến thức mới
          </p>
          <Button size="lg" variant="secondary" asChild>
            <a href="/signup">Đăng ký miễn phí</a>
          </Button>
        </div>
      </section>
      <Footer/>
    </div>
  );
}
