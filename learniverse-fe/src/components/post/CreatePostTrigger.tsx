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
import { useAuth } from "@/context/AuthContext"

interface CreatePostTriggerProps {
  onPostCreated?: () => void
  groupId?: string
  groupName?: string
}

export function CreatePostTrigger({ onPostCreated, groupId, groupName }: CreatePostTriggerProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Card className="p-4 flex gap-3 items-center cursor-pointer hover:bg-accent">
          <Avatar>
            <AvatarImage src={user?.avatarUrl} />
            <AvatarFallback>{user?.username.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="w-full text-muted-foreground">
            {groupName ? `Chia sẻ với ${groupName}` : `Bạn đang nghĩ gì, ${user?.username}?`}
          </div>
          <Button>Đăng bài</Button>
        </Card>
      </DialogTrigger>
      <CreatePostModal 
        setOpen={setOpen} 
        onSuccess={onPostCreated ?? (() => { })} 
        groupId={groupId}
        groupName={groupName}
      />
    </Dialog>
  )
}