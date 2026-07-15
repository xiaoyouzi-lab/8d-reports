"use client";

import { useState } from "react";
import { Copy, Link2, LoaderCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ExternalTaskComposer({
  caseId,
  status,
}: {
  caseId: string;
  status: string;
}) {
  const taskType =
    status === "ready_for_customer" ? "customer_review" : "supplier_response";
  const isCustomer = taskType === "customer_review";
  const [open, setOpen] = useState(false),
    [name, setName] = useState(""),
    [organization, setOrganization] = useState(""),
    [recipientEmail, setRecipientEmail] = useState(""),
    [expiresAt, setExpiresAt] = useState(""),
    [creating, setCreating] = useState(false),
    [link, setLink] = useState("");
  const allowed = isCustomer
    ? status === "ready_for_customer"
    : ["draft", "changes_requested_from_supplier"].includes(status);
  if (!allowed) return null;
  const create = async () => {
    setCreating(true);
    try {
      const response = await fetch(`/api/quality-cases/${caseId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskType,
          participantName: name,
          participantOrganization: organization,
          recipientEmail,
          expiresAt,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(
          typeof data.error === "string" ? data.error : "无法创建任务链接",
        );
      const path = isCustomer
        ? `/customer-review/${data.token}`
        : `/supplier/${data.token}`;
      setLink(`${window.location.origin}${path}`);
      if (data.emailDelivery === "failed") {
        toast.warning(isCustomer ? "Link created, but email was not delivered" : "链接已创建，但邮件发送失败", {
          description: data.emailError,
        });
      } else {
        toast.success(
          isCustomer ? "Customer invitation sent" : "供应商邀请邮件已发送",
        );
      }
    } catch (error) {
      toast.error("未能创建任务链接", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setCreating(false);
    }
  };
  const copy = async () => {
    await navigator.clipboard.writeText(link);
    toast.success("链接已复制");
  };
  return (
    <div className="mt-4 rounded-lg border border-indigo-200 bg-indigo-50 p-3">
      <div className="flex items-center gap-2 text-sm font-medium text-indigo-950">
        <Link2 className="size-4" />
        {isCustomer
          ? "Create English customer review link"
          : "创建中文供应商任务链接"}
      </div>
      {!open && !link ? (
        <Button
          size="sm"
          className="mt-3 bg-indigo-600 text-white hover:bg-indigo-700"
          onClick={() => setOpen(true)}
        >
          <Send className="size-3.5" />
          {isCustomer ? "Invite customer" : "邀请供应商"}
        </Button>
      ) : link ? (
        <div className="mt-3 flex gap-2">
          <Input value={link} readOnly aria-label="External task link" />
          <Button
            size="icon-sm"
            variant="outline"
            onClick={() => void copy()}
            aria-label="Copy task link"
          >
            <Copy className="size-3.5" />
          </Button>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="space-y-1">
            <Label htmlFor="external-email">
              {isCustomer ? "Customer email" : "供应商邮箱"}
            </Label>
            <Input
              id="external-email"
              type="email"
              autoComplete="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="external-name">
              {isCustomer ? "Customer reviewer" : "供应商联系人"}
            </Label>
            <Input
              id="external-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="external-org">
              {isCustomer ? "Customer organization" : "供应商组织"}
            </Label>
            <Input
              id="external-org"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="external-expiry">
              {isCustomer ? "Link expiry" : "链接到期日"}
            </Label>
            <Input
              id="external-expiry"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={creating}
            >
              取消
            </Button>
            <Button
              size="sm"
              className="bg-indigo-600 text-white hover:bg-indigo-700"
              disabled={
                creating || !name.trim() || !organization.trim() || !recipientEmail.trim() || !expiresAt
              }
              onClick={() => void create()}
            >
              {creating ? (
                <LoaderCircle className="size-3.5 animate-spin" />
              ) : (
                <Send className="size-3.5" />
              )}
              {isCustomer ? "Send invitation" : "发送邀请"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
