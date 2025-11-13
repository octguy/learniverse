"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Users, UserPlus, MessageCircle, Rss, Pencil, Bookmark } from "lucide-react"

import { ProfileCard } from "@/components/auth/profile-card"
import { ProfileEditForm } from "@/components/auth/profile-edit-form"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ProfileProgressBar } from "@/components/auth/profile-progress-bar" //

// --- Mock data ---
const mockProfileData = {
    displayName: "Khải Nguyễn",
    username: "@khainguyen_dev",
    school: "Đại học Công nghệ Thông tin",
    major: "Kỹ thuật phần mềm",
    country: "Việt Nam",
    favoriteSubject: "Lập trình Web",
    bio: "Đây là phần giới thiệu về bản thân (bio).\nTôi là một lập trình viên đam mê React và Next.js. Tôi đang tìm kiếm cơ hội để học hỏi và phát triển.",
    defaultCoverUrl: "/login-banner.jpg", //
    defaultAvatarUrl: "/next.svg", //
    completion: 60,
}


const mockFriends = [
    { name: "Steve Jobs", desc: "CEO of Apple", avatar: "https://randomuser.me/api/portraits/men/1.jpg" },
    { name: "Bill Gates", desc: "Microsoft", avatar: "https://randomuser.me/api/portraits/men/2.jpg" },
    { name: "Ada Lovelace", desc: "Mathematician", avatar: "https://randomuser.me/api/portraits/women/3.jpg" },
    { name: "Marie Curie", desc: "Scientist", avatar: "https://randomuser.me/api/portraits/women/4.jpg" },
    { name: "Turing", desc: "Computer Scientist", avatar: "https://randomuser.me/api/portraits/men/5.jpg" },
            { name: "Grace Hopper", desc: "Admiral", avatar: "https://randomuser.me/api/portraits/women/6.jpg" },
]

const mockUsers = [
    { name: "Marie Clark", desc: "Software Engineer", avatar: "https://randomuser.me/api/portraits/women/1.jpg" },
    { name: "Tom Wilson", desc: "Product Manager", avatar: "https://randomuser.me/api/portraits/men/1.jpg" },
    { name: "Mia Torres", desc: "UX Designer", avatar: "https://randomuser.me/api/portraits/women/2.jpg" },
]
const mockPosts = [
    { title: "Lorem ipsum dolor sit amet", img: "/onboarding/study.jpg" },
    { title: "Consectetur adipiscing elit", img: "/onboarding/friends.jpg" },
    { title: "Sed do eiusmod tempor", img: "/onboarding/personal.jpeg" },
]


export default function ProfilePage() {
    const [isEditingProfile, setIsEditingProfile] = useState(false)
    const [isEditingBio, setIsEditingBio] = useState(false)

    const [profileData, setProfileData] = useState(mockProfileData)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const token = sessionStorage.getItem('accessToken');
        if (!token) {
            window.location.href = '/login';
            return;
        }
        setLoading(false);
    }, []);

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto text-center p-10">
                Đang tải thông tin cá nhân...
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* === Cột chính (bên trái) === */}
                <div className="lg:col-span-2 space-y-6">
                    {isEditingProfile ? (
                        <>
                            <ProfileEditForm />
                            <Button onClick={() => setIsEditingProfile(false)} variant="outline" className="mt-4">
                                Hủy
                            </Button>
                        </>
                    ) : (
                        <ProfileCard
                            displayName={profileData.displayName}
                            username={profileData.username}
                            school={profileData.school}
                            major={profileData.major}
                            country={profileData.country}
                            favoriteSubject={profileData.favoriteSubject}
                            defaultCoverUrl={profileData.defaultCoverUrl}
                            defaultAvatarUrl={profileData.defaultAvatarUrl}
                            onEditClick={() => setIsEditingProfile(true)}
                        />
                    )}

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Thông tin chung</CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setIsEditingBio(true)}>
                                <Pencil className="w-5 h-5 text-gray-600 hover:text-black" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {isEditingBio ? (
                                <div className="space-y-4">
                                    <textarea
                                        defaultValue={profileData.bio}
                                        rows={5}
                                        className="w-full p-2 border rounded-md"
                                    />
                                    <div className="flex gap-2">
                                        <Button onClick={() => setIsEditingBio(false)}>Lưu</Button>
                                        <Button variant="outline" onClick={() => setIsEditingBio(false)}>Hủy</Button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-700 whitespace-pre-line">
                                    {profileData.bio}
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Bạn bè</CardTitle>
                            <CardDescription>25K bạn bè</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-6">
                            {mockFriends.map(friend => (
                                <div key={friend.name} className="flex items-start gap-3">
                                    <Avatar>
                                        <AvatarImage src={friend.avatar} />
                                        <AvatarFallback>{friend.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm">{friend.name}</p>
                                        <p className="text-xs text-muted-foreground">{friend.desc}</p>
                                    </div>
                                    <Button variant="outline" size="sm" className="shrink-0">
                                        Connect
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                        <CardFooter>
                            <Button variant="link" className="p-0 h-auto">
                                Tất cả bạn bè &rarr;
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bookmark className="w-5 h-5" />
                                Bài viết đã lưu
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {/* Lấy 2 ảnh từ mockPosts để minh họa */}
                                <Image src="/onboarding/personal.jpeg" alt="Post 3" width={300} height={200} className="rounded-md object-cover aspect-square" />
                                <Image src="/onboarding/study.jpg" alt="Post 1" width={300} height={200} className="rounded-md object-cover aspect-square" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Rss className="w-5 h-5" />
                                Bài viết & Câu hỏi
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                <Image src="/onboarding/study.jpg" alt="Post 1" width={300} height={200} className="rounded-md object-cover aspect-square" />
                                <Image src="/onboarding/friends.jpg" alt="Post 2" width={300} height={200} className="rounded-md object-cover aspect-square" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardContent className="pt-6"> {/* Thêm pt-6 vì không có CardHeader */}
                            <ProfileProgressBar value={profileData.completion} />
                            <p className="text-sm text-muted-foreground mt-2">
                                Bạn đã hoàn thành {profileData.completion}% hồ sơ. Hãy cập nhật thêm!
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Người dùng có chung sở thích</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {mockUsers.map(user => (
                                <div key={user.name} className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={user.avatar} />
                                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm">{user.name}</p>
                                        <p className="text-xs text-muted-foreground">{user.desc}</p>
                                    </div>
                                    <Button variant="outline" size="icon" className="shrink-0">
                                        <MessageCircle className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Bạn có thể quen</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {mockUsers.slice(0, 2).map(user => (
                                <div key={user.name} className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={user.avatar} />
                                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm">{user.name}</p>
                                        <p className="text-xs text-muted-foreground">{user.desc}</p>
                                    </div>
                                    <Button variant="outline" size="icon" className="shrink-0">
                                        <UserPlus className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Bài viết phổ biến</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {mockPosts.map(post => (
                                <div key={post.title} className="flex items-center gap-3">
                                    <Image src={post.img} alt={post.title} width={64} height={64} className="rounded-md object-cover aspect-square" />
                                    <p className="font-medium text-sm flex-1">{post.title}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}