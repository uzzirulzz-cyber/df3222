"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Settings2, Save } from "lucide-react";
import type { IptvSettings } from "@/lib/storage";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: IptvSettings;
  onSave: (s: IptvSettings) => void;
}

export function SettingsDialog({
  open,
  onOpenChange,
  settings,
  onSave,
}: SettingsDialogProps) {
  const [draft, setDraft] = useState<IptvSettings>(settings);

  // Sync draft when dialog opens
  const handleOpenChange = (v: boolean) => {
    if (v) setDraft(settings);
    onOpenChange(v);
  };

  const handleSave = () => {
    onSave(draft);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Settings2 className="w-4 h-4" /> Settings
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Configure playback options. Saved to this browser only.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Live stream format */}
          <div className="space-y-3">
            <div>
              <Label className="text-zinc-200">Live stream format</Label>
              <p className="text-xs text-zinc-500 mt-1">
                Some providers don&apos;t serve HLS (.m3u8). Switch to MPEG-TS (.ts) if
                live channels fail to play.
              </p>
            </div>
            <RadioGroup
              value={draft.liveFormat}
              onValueChange={(v) =>
                setDraft((d) => ({ ...d, liveFormat: v as "m3u8" | "ts" }))
              }
              className="grid grid-cols-2 gap-2"
            >
              <label
                htmlFor="fmt-m3u8"
                className={`flex flex-col gap-1 p-3 rounded-md border cursor-pointer ${
                  draft.liveFormat === "m3u8"
                    ? "border-rose-500 bg-rose-950/30"
                    : "border-zinc-800 bg-zinc-800/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem id="fmt-m3u8" value="m3u8" />
                  <span className="text-sm font-medium">HLS (.m3u8)</span>
                </div>
                <span className="text-xs text-zinc-500 ml-6">Recommended. Lower latency.</span>
              </label>
              <label
                htmlFor="fmt-ts"
                className={`flex flex-col gap-1 p-3 rounded-md border cursor-pointer ${
                  draft.liveFormat === "ts"
                    ? "border-rose-500 bg-rose-950/30"
                    : "border-zinc-800 bg-zinc-800/40"
                }`}
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem id="fmt-ts" value="ts" />
                  <span className="text-sm font-medium">MPEG-TS (.ts)</span>
                </div>
                <span className="text-xs text-zinc-500 ml-6">Fallback if HLS fails.</span>
              </label>
            </RadioGroup>
          </div>

          {/* EPG overlay toggle */}
          <div className="flex items-start justify-between gap-4 p-3 rounded-md border border-zinc-800 bg-zinc-800/40">
            <div className="space-y-1 flex-1">
              <Label htmlFor="epg-toggle" className="text-zinc-200">
                Show &quot;Now playing&quot; on live cards
              </Label>
              <p className="text-xs text-zinc-500">
                Pulls short EPG for each visible live channel to show what&apos;s airing
                now. Disabling saves bandwidth on large channel lists.
              </p>
            </div>
            <Switch
              id="epg-toggle"
              checked={draft.showEpgOnCards}
              onCheckedChange={(v) => setDraft((d) => ({ ...d, showEpgOnCards: v }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-zinc-300 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white"
          >
            <Save className="w-4 h-4 mr-2" /> Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
