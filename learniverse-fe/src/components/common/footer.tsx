'use client';
export function Footer() {
    return (
        <footer className="bg-gray-900 text-white py-4">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                        <div className="flex items-center space-x-2 mb-4">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg">L</span>
                            </div>
                            <span className="text-xl font-bold">Learniverse</span>
                        </div>
                        <p className="text-gray-400">
                            Nền tảng học tập xã hội cho sinh viên và người học
                        </p>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-4">Hỗ trợ</h3>
                        <ul className="space-y-2 text-gray-400">
                            <li><a href="#" className="hover:text-white">Trung tâm trợ giúp</a></li>
                            <li><a href="#" className="hover:text-white">Liên hệ</a></li>
                            <li><a href="#" className="hover:text-white">Báo cáo lỗi</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-4">Công ty</h3>
                        <ul className="space-y-2 text-gray-400">
                            <li><a href="#" className="hover:text-white">Về chúng tôi</a></li>
                            <li><a href="#" className="hover:text-white">Blog</a></li>
                            <li><a href="#" className="hover:text-white">Tuyển dụng</a></li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                    <p>&copy; 2024 Learniverse. Tất cả quyền được bảo lưu.</p>
                </div>
            </div>
        </footer>);
}
