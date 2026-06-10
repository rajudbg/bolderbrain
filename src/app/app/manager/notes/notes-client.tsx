"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { createManagerNote } from "./notes-actions";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export function NotesClient({ teamMembers, initialNotes }: { teamMembers: any[], initialNotes: any[] }) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(teamMembers[0]?.id || "");
  const [newNote, setNewNote] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedEmployeeNotes = initialNotes.filter(n => n.employeeId === selectedEmployeeId);
  const selectedEmployee = teamMembers.find(m => m.id === selectedEmployeeId);

  async function handleAddNote() {
    if (!newNote.trim()) return;
    setIsSubmitting(true);
    try {
      await createManagerNote(selectedEmployeeId, newNote);
      toast.success("Note added");
      setNewNote("");
      setIsOpen(false);
    } catch (e) {
      toast.error("Failed to add note");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid md:grid-cols-4 gap-6">
      {/* Sidebar with employees */}
      <div className="md:col-span-1 space-y-2 border-r border-border/60 pr-4">
        <h3 className="font-semibold text-sm tracking-wide text-muted-foreground uppercase mb-4">Team Members</h3>
        {teamMembers.map((member) => (
          <button
            key={member.id}
            onClick={() => setSelectedEmployeeId(member.id)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
              selectedEmployeeId === member.id ? "bg-white/10 text-white font-medium" : "text-white/60 hover:bg-white/5 hover:text-white"
            }`}
          >
            {member.name || member.email}
          </button>
        ))}
      </div>

      {/* Main content - Notes list */}
      <div className="md:col-span-3 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{selectedEmployee?.name || selectedEmployee?.email}</h2>
            <p className="text-sm text-muted-foreground">1:1 Coaching Notes</p>
          </div>
          
          <Button onClick={() => setIsOpen(true)}>Add Note</Button>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>New Coaching Note</DialogTitle>
                <DialogDescription>
                  Add a private note about your 1:1 with {selectedEmployee?.name}.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Discussed recent project wins and areas for growth..."
                  className="min-h-[150px]"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button onClick={handleAddNote} disabled={isSubmitting || !newNote.trim()}>
                  {isSubmitting ? "Saving..." : "Save Note"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {selectedEmployeeNotes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border rounded-xl bg-card/20">
              No notes yet. Add your first coaching note for {selectedEmployee?.name}.
            </div>
          ) : (
            selectedEmployeeNotes.map((note) => (
              <div key={note.id} className="bg-card/50 border rounded-xl p-4 space-y-2">
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                </div>
                <p className="text-sm whitespace-pre-wrap text-white/90">{note.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
