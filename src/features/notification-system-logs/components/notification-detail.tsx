"use client";
import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { getNotificationDetail } from "../api/notification-inbox";
import { NotificationImages } from "./notification-images";

export function NotificationDetail({ id, userId, onClose }: { id: string; userId: string | undefined; onClose: (readId?: string) => void }) {
 const dialog = useRef<HTMLDialogElement>(null);
 const detail = useQuery({ queryKey: ["notifications", "detail", userId, id], queryFn: ({ signal }) => getNotificationDetail(id, signal), enabled: Boolean(userId), staleTime: 0, retry: false });
 useEffect(() => { dialog.current?.showModal(); }, []);
 const finish = () => onClose(detail.data && !detail.data.readAt ? id : undefined);
 return <Dialog dialogRef={dialog} title={detail.data?.title ?? "Notification details"} onCancel={(event) => { event.preventDefault(); dialog.current?.close(); }} onClose={finish} className="max-h-[85dvh] overflow-y-auto">
 {detail.isPending ? <p role="status">Loading notification...</p> : detail.isError ? <Alert>Unable to load notification. <Button variant="secondary" onClick={() => void detail.refetch()}>Try again</Button></Alert> : <>
 <p className="text-muted text-sm">{detail.data.sender} ? {new Date(detail.data.createdAt).toLocaleString("en-GB")}</p>
 <p className="mt-4 whitespace-pre-wrap [overflow-wrap:anywhere]">{detail.data.message}</p>
 {detail.data.notificationId ? <NotificationImages notificationId={detail.data.notificationId} images={detail.data.images} /> : null}
 </>}
 <div className="mt-6 flex justify-end"><Button type="button" onClick={() => dialog.current?.close()}>Close</Button></div>
 </Dialog>;
}
