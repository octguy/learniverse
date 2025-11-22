'use client'
import React, { useState } from "react"
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import CreatePostModal from "@/components/post/CreatePostModal"

export function CreatePostTrigger() {
    const [open, setOpen] = useState(false)
    const mockUser = {
        displayName: "Khai Nguyen",
        avatar: "https://github.com/shadcn.png",
    }

    return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card className="p-4 flex gap-3 items-center cursor-pointer hover:bg-accent">
          <Avatar>
            <AvatarImage src={mockUser.avatar} />
            <AvatarFallback>{mockUser.displayName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="w-full text-muted-foreground">
            Bạn đang nghĩ gì, {mockUser.displayName}?
          </div>
          <Button>Đăng bài</Button>
        </Card>
      </DialogTrigger>
      <CreatePostModal setOpen={setOpen} />
    </Dialog>
  )
}