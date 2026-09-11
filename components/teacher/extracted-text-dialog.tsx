"use client"

import { LoaderCircle, RefreshCw, Save, ScanText } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

export interface ExtractedFile {
  id: string
  filename: string
}

interface ExtractedTextDialogProps {
  files: ExtractedFile[]
  texts: Record<string, string>
  onTextChange: (materialId: string, value: string) => void
  onSave: (materialId: string) => void
  onReread: (materialId: string) => void
  isSaving: boolean
  isRereading: boolean
  isLoading: boolean
  loadingMessage?: string | null
  totalCharacters: number
}

export function ExtractedTextDialog({
  files,
  texts,
  onTextChange,
  onSave,
  onReread,
  isSaving,
  isRereading,
  isLoading,
  loadingMessage,
  totalCharacters,
}: ExtractedTextDialogProps) {
  return (
    <Dialog>
      {/* type="button" matters: this sits inside the generate form, and a bare
          button there would submit it instead of opening the dialog. */}
      <DialogTrigger
        render={<Button type="button" variant="outline" className="w-full justify-start" />}
      >
        {isLoading ? <LoaderCircle className="size-4 animate-spin" /> : <ScanText className="size-4" />}
        {isLoading ? "Loading text..." : "View / edit extracted text"}
        <span className="ml-auto text-xs text-muted-foreground">
          {isLoading ? "" : `${totalCharacters.toLocaleString()} characters`}
        </span>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Extracted text</DialogTitle>
          <DialogDescription>
            This is the text read from your file(s), including any image the AI has already read.
            Questions are made only from what is here — fix any mistakes before generating.
          </DialogDescription>
        </DialogHeader>

        <div className="-mx-1 flex max-h-[60vh] flex-col gap-4 overflow-y-auto px-1">
          {isLoading ? (
            <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
              {loadingMessage ?? "Loading text..."}
            </p>
          ) : (
            files.map((file) => (
              <div key={file.id} className="flex flex-col gap-1.5">
                {files.length > 1 && (
                  <span className="truncate text-xs font-medium text-muted-foreground">
                    {file.filename}
                  </span>
                )}
                <Textarea
                  rows={12}
                  value={texts[file.id] ?? ""}
                  onChange={(event) => onTextChange(file.id, event.target.value)}
                  placeholder="No text was read from this file. Type or paste the text here."
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isSaving || !(texts[file.id] ?? "").trim()}
                    onClick={() => onSave(file.id)}
                  >
                    <Save />
                    Save text
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isRereading}
                    onClick={() => onReread(file.id)}
                  >
                    <RefreshCw className={cn(isRereading && "animate-spin")} />
                    {isRereading ? "Reading..." : "Read file again"}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  )
}
