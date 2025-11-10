import React, { useState } from "react";
import { AvatarUploader } from "./avatar-uploader";
import { BackgroundUploader } from "./background-uploader";
import {TagSelector} from "@/components/auth/tag-selector";

export function ProfileEditForm() {
    const [formData, setFormData] = useState({
        fullName: "Nguyễn Quang Khải",
        displayName: "Khai Nguyen",
        school: "Đại học CNTT - UIT",
        country: "Việt Nam",
        favoriteSubject: "Toán học",
        improveSubject: "Lập trình hướng đối tượng",
        email: "alexarawles@gmail.com",
        avatarUrl: "/favicon.ico",
        coverUrl: "/favicon.ico",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const [favoriteSubjects, setFavoriteSubjects] = useState<string[]>([formData.favoriteSubject])
    const [improveSubjects, setImproveSubjects] = useState<string[]>([formData.improveSubject])
    const handleSave = () => console.log("Dữ liệu lưu:", formData);
    const handleCancel = () => console.log("Huỷ thay đổi");

    return (
        <div className="max-w-[1000px] mx-auto bg-white rounded-3xl shadow-lg p-12 text-black">
            {/* Ảnh nền */}
            <div className="relative">
                <BackgroundUploader
                    imageUrl={formData.coverUrl}
                    onUpload={(url) => setFormData({ ...formData, coverUrl: url })}
                />
            </div>

            {/* Avatar + Tên + Email, đặt bên dưới ảnh nền */}
            <div className="flex items-center gap-6 -mt-24">
                <AvatarUploader
                    imageUrl={formData.avatarUrl}
                    onUpload={(url) => setFormData({ ...formData, avatarUrl: url })}
                    className="w-40 h-40 ml-8 rounded-full border-4 border-white"
                />
                <div>
                    <h2 className="text-3xl font-bold mt-30 ml-8 text-black">{formData.displayName}</h2>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                        }
                        className="text-base italic ml-4 mt-2 border rounded-xl px-4 py-2 text-black w-80"
                        placeholder="Nhập email"
                    />
                </div>
                {/* Nút hành động */}
                <div className="flex justify-end gap-6 mt-24 ml-auto max-h-[45]">
                    <button
                        onClick={handleCancel}
                        className="bg-red-500 text-white px-8 py-3 rounded-xl hover:bg-red-600 text-base"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSave}
                        className="bg-blue-500 text-white px-8 py-3 rounded-xl hover:bg-blue-600 text-base"
                    >
                        Lưu
                    </button>
                </div>
            </div>

            {/* Form thông tin */}
            <div className="grid grid-cols-2 gap-x-16 gap-y-5 mt-12 text-black">
                {[
                    { label: "Họ tên", name: "fullName" },
                    { label: "Quốc gia", name: "country" },
                    { label: "Tên hiển thị", name: "displayName" },
                    { label: "Giáo dục - Trường", name: "school" },

                ].map((field) => (
                    <div key={field.name}>
                        <label className="block font-medium">{field.label}</label>
                        <input
                            type="text"
                            name={field.name}
                            value={formData[field.name as keyof typeof formData]}
                            onChange={handleChange}
                            className="w-full min-w-[300px] border mt-2 rounded-xl px-4 py-4 bg-gray-200 text-black text-base max-h-[30px]"
                        />
                    </div>
                ))}
                <div>
                    <label className="block font-medium">Môn học yêu thích</label>
                    <TagSelector
                        mode="profile"
                        selectedTags={favoriteSubjects}
                        onChange={(tags) => {
                            setFavoriteSubjects(tags)
                            setFormData({...formData, favoriteSubject: tags.join(", ")})
                        }}
                    />
                </div>
                <div>
                    <label className="block font-medium">Môn học muốn cải thiện</label>
                    <TagSelector
                        mode="profile"
                        selectedTags={improveSubjects}
                        onChange={(tags) => {
                            setImproveSubjects(tags)
                            setFormData({...formData, improveSubject: tags.join(", ")})
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
