import React from 'react';
import { MessageCircle } from 'lucide-react';

const WelcomeScreen = () => {
  return (
    <div className="flex-1 flex items-center justify-center text-center text-muted-foreground bg-gray-50">
      <div>
        <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <h2 className="text-xl font-semibold">Chọn một cuộc trò chuyện</h2>
        <p>Bắt đầu nhắn tin bằng cách chọn từ danh sách bên trái.</p>
      </div>
    </div>
  );
};

export default WelcomeScreen;
