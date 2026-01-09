"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { reportService } from "@/lib/api/reportService";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportableType: "POST" | "QUESTION" | "ANSWER" | "COMMENT";
  reportableId: string;
}

const REPORT_REASONS = [
  { value: "SPAM", label: "Spam hoặc quảng cáo" },
  { value: "HARASSMENT", label: "Quấy rối hoặc bắt nạt" },
  { value: "TOXIC", label: "Lời nói thù ghét/Độc hại" },
  { value: "INAPPROPRIATE", label: "Nội dung không phù hợp" },
  { value: "OFF_TOPIC", label: "Lạc đề" },
  { value: "COPYRIGHT", label: "Vi phạm bản quyền" },
  { value: "DUPLICATE", label: "Nội dung trùng lặp" },
  { value: "OTHER", label: "Khác" },
];

export function ReportDialog({ open, onOpenChange, reportableType, reportableId }: ReportDialogProps) {
  const [reason, setReason] = useState("SPAM");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [alreadyReported, setAlreadyReported] = useState(false);

  // Check if already reported when dialog opens
  const checkStatus = async () => {
    if (!open) return;
    setIsChecking(true);
    try {
      const result = await reportService.checkReportExisting(reportableType, reportableId);
      if (result.data) {
        setAlreadyReported(true);
      } else {
        setAlreadyReported(false);
      }
    } catch (error) {
      console.error("Failed to check report status", error);
    } finally {
      setIsChecking(false);
    }
  };

  // Call checkStatus when open changes to true
  useEffect(() => {
    if (open) {
      checkStatus();
      setReason("SPAM");
      setDescription("");
    }
  }, [open, reportableType, reportableId]);

  const handleSubmit = async () => {
    if (!reason || alreadyReported) return;
    
    setIsSubmitting(true);
    try {
      await reportService.createReport({
        reportableType,
        reportableId,
        reason,
        description: description || "No description provided"
      });
      toast.success("Báo cáo đã được gửi. Cảm ơn bạn đã đóng góp!");
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Gửi báo cáo thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (alreadyReported) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Đã báo cáo</DialogTitle>
            <DialogDescription>
              Bạn đã báo cáo nội dung này rồi. Cảm ơn bạn đã giúp chúng tôi giữ môi trường lành mạnh.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Báo cáo vi phạm</DialogTitle>
          <DialogDescription>
            Hãy chọn lý do bạn muốn báo cáo nội dung này.
          </DialogDescription>
        </DialogHeader>
        
        {isChecking ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
        <div className="grid gap-4 py-4">
          <div className="space-y-3">
            <Label>Lý do</Label>
            <RadioGroup value={reason} onValueChange={setReason} className="gap-2">
              {REPORT_REASONS.map((r) => (
                <div key={r.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={r.value} id={r.value} />
                  <Label htmlFor={r.value} className="font-normal cursor-pointer">
                    {r.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Mô tả thêm (tùy chọn)</Label>
            <Textarea 
              id="description" 
              placeholder="Chi tiết về vi phạm..." 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="resize-none"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !reason}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Gửi báo cáo
          </Button>
        </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
