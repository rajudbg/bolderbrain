"use client";

import { useTransition } from "react";
import { updateOrganizationSettings } from "./settings-actions";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function SettingsForm({
  orgName,
  orgSlug,
}: {
  orgName: string;
  orgSlug: string;
}) {
  const [pending, startTransition] = useTransition();

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await updateOrganizationSettings(formData);
        toast.success("Settings updated successfully");
      } catch (err: any) {
        toast.error(err.message || "Failed to update settings");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization Profile</CardTitle>
        <CardDescription>Manage your company's identity on BolderBrain.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4 max-w-md">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Organization Name</label>
            <input
              name="name"
              defaultValue={orgName}
              required
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Workspace Slug</label>
            <div className="flex rounded-md border border-input shadow-sm">
              <span className="flex items-center px-3 border-r border-input bg-muted/50 text-muted-foreground text-sm">
                bolderbrain.com/
              </span>
              <input
                name="slug"
                defaultValue={orgSlug}
                required
                className="w-full bg-transparent px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <p className="text-[0.8rem] text-muted-foreground">Used for your unique sign-in URL.</p>
          </div>

          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
