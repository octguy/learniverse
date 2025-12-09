"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Users, UserPlus, MessageCircle, Rss, Pencil, Bookmark } from "lucide-react"

import { ProfileCard } from "@/components/auth/profile-card"
import { ProfileEditForm } from "@/components/auth/profile-edit-form"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ProfileProgressBar } from "@/components/auth/profile-progress-bar"
import { userProfileService } from "@/lib/api/userProfileService"
import { UserProfileResponse } from "@/types/userProfile"
import { useAuth } from "@/context/AuthContext"

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
    const { user } = useAuth();

    const [isEditingProfile, setIsEditingProfile] = useState(false)
    const [isEditingBio, setIsEditingBio] = useState(false)
    const [loading, setLoading] = useState(true)

    const [profile, setProfile] = useState<UserProfileResponse | null>(null)
    const [bioInput, setBioInput] = useState("")

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const res = await userProfileService.getMyProfile();
            setProfile(res);
            setBioInput(res.bio || "");
        } catch (error) {
            console.error("Failed to fetch profile", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveBio = async () => {
        try {
            setLoading(true);
            await userProfileService.updateMyProfile({ bio: bioInput });

            if (profile) {
                setProfile({ ...profile, bio: bioInput });
            }
            setIsEditingBio(false);
        } catch (error) {
            console.error("Failed to update bio", error);
            alert("Cập nhật giới thiệu thất bại");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchProfile();
    }, []);

    const calculateCompletion = () => {
        if (!profile) return 0;
        let score = 0;
        if (profile.displayName) score += 20;
        if (profile.bio) score += 20;
        if (profile.avatarUrl) score += 20;
        if (profile.tags && profile.tags.length > 0) score += 20;
        score += 20;
        return Math.min(score, 100);
    };

    if (loading && !profile) {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <p className="text-muted-foreground">Đang tải thông tin cá nhân...</p>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {isEditingProfile ? (
                        <ProfileEditForm
                            initialData={profile}
                            onCancel={() => setIsEditingProfile(false)}
                            onSuccess={() => {
                                setIsEditingProfile(false);
                                fetchProfile();
                            }}
                        />
                    ) : (
                        <ProfileCard
                            displayName={profile?.displayName || user?.username || "Người dùng"}
                            username={user?.email}
                            school="Đại học Công nghệ Thông tin"
                            major="Kỹ thuật phần mềm"
                            country="Việt Nam"
                            favoriteSubject={profile?.tags?.map(t => t.name).join(", ")}
                            defaultCoverUrl="/login-banner.jpg"
                            defaultAvatarUrl={profile?.avatarUrl || "/favicon.ico"}
                            onEditClick={() => setIsEditingProfile(true)}
                        />
                    )}

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle>Thông tin chung (Bio)</CardTitle>
                            {!isEditingBio && (
                                <Button variant="ghost" size="icon" onClick={() => setIsEditingBio(true)}>
                                    <Pencil className="w-4 h-4 text-muted-foreground hover:text-primary" />
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="pt-4">
                            {isEditingBio ? (
                                <div className="space-y-4">
                                    <textarea
                                        value={bioInput}
                                        onChange={(e) => setBioInput(e.target.value)}
                                        rows={5}
                                        className="w-full p-3 border rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary outline-none resize-none"
                                        placeholder="Viết đôi dòng về bản thân..."
                                    />
                                    <div className="flex gap-2 justify-end">
                                        <Button variant="outline" onClick={() => {
                                            setIsEditingBio(false);
                                            setBioInput(profile?.bio || "");
                                        }}>
                                            Hủy
                                        </Button>
                                        <Button onClick={handleSaveBio} disabled={loading}>
                                            {loading ? "Đang lưu..." : "Lưu"}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground whitespace-pre-line">
                                    {profile?.bio || "Chưa có thông tin giới thiệu."}
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Mock Data Cards */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Bạn bè</CardTitle>
                            <CardDescription>25K bạn bè (Mô phỏng)</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {mockFriends.map((friend, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                    <Avatar>
                                        <AvatarImage src={friend.avatar} />
                                        <AvatarFallback>{friend.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="font-medium text-sm truncate">{friend.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{friend.desc}</p>
                                    </div>
                                    <Button variant="outline" size="sm" className="h-8 px-3">
                                        Kết bạn
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                        <CardFooter>
                            <Button variant="link" className="w-full">
                                Xem tất cả bạn bè
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
                                <div className="aspect-video relative rounded-md overflow-hidden bg-muted">
                                    <Image src="/onboarding/personal.jpeg" alt="Saved Post" fill className="object-cover hover:scale-105 transition-transform duration-300" />
                                </div>
                                <div className="aspect-video relative rounded-md overflow-hidden bg-muted">
                                    <Image src="/onboarding/study.jpg" alt="Saved Post" fill className="object-cover hover:scale-105 transition-transform duration-300" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Rss className="w-5 h-5" />
                                Hoạt động của tôi
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-6 text-sm mb-6">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-primary">{profile?.postCount || 0}</p>
                                    <p className="text-muted-foreground">Bài viết</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-primary">{profile?.answeredQuestionCount || 0}</p>
                                    <p className="text-muted-foreground">Câu trả lời</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                <div className="aspect-square relative rounded-md overflow-hidden bg-muted">
                                    <Image src="/onboarding/study.jpg" alt="Activity 1" fill className="object-cover" />
                                </div>
                                <div className="aspect-square relative rounded-md overflow-hidden bg-muted">
                                    <Image src="/onboarding/friends.jpg" alt="Activity 2" fill className="object-cover" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* === Sidebar (bên phải) === */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardContent className="pt-6">
                            <ProfileProgressBar value={calculateCompletion()} />
                            <p className="text-sm text-muted-foreground mt-3 text-center">
                                Hồ sơ hoàn thiện {calculateCompletion()}%
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Gợi ý kết bạn</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {mockUsers.slice(0, 3).map((user, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={user.avatar} />
                                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{user.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{user.desc}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <UserPlus className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Thảo luận nổi bật</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {mockPosts.map((post, idx) => (
                                <div key={idx} className="flex gap-3 group cursor-pointer">
                                    <div className="relative h-16 w-16 shrink-0 rounded-md overflow-hidden">
                                        <Image src={post.img} alt={post.title} fill className="object-cover group-hover:scale-110 transition-transform" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                                            {post.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">2 giờ trước</p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}