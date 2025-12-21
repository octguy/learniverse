import apiService from "@/lib/apiService";

export const uploadFile = async (
  roomId: string,
  messageType: "IMAGE" | "VIDEO" | "FILE",
  file: File,
  textContent?: string,
  parentMessageId?: string,
  onProgress?: (progress: number) => void
): Promise<any> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("messageType", messageType);
  
  if (textContent) {
    formData.append("textContent", textContent);
  }
  
  if (parentMessageId) {
    formData.append("parentMessageId", parentMessageId);
  }

  return apiService.post(`/messages/send-with-file/${roomId}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    },
  });
};
