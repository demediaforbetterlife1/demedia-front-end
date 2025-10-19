"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

type FeedbackModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export default function FeedbackModal({ open, onOpenChange }: FeedbackModalProps) {
    const [email, setEmail] = useState("");
    const [category, setCategory] = useState("General");
    const [message, setMessage] = useState("");

    const handleSubmit = () => {
        console.log("Feedback Submitted:", { email, category, message });
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg bg-white dark:bg-neutral-900 rounded-2xl shadow-lg">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Send Feedback</DialogTitle>
                    <DialogDescription className="text-sm text-neutral-500 dark:text-neutral-400">
                        We’d love to hear your thoughts! Please fill in the form below.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email (optional)</Label>
                        <Input
                            id="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="bg-neutral-100 dark:bg-neutral-800"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="category">Category</Label>
                        <select
                            id="category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="p-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800"
                        >
                            <option>General</option>
                            <option>Bug Report</option>
                            <option>Feature Request</option>
                            <option>UI/UX</option>
                            <option>Other</option>
                        </select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="message">Your Feedback</Label>
                        <Textarea
                            id="message"
                            placeholder="Write your feedback here..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="bg-neutral-100 dark:bg-neutral-800 min-h-[100px]"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)} variant="outline">Cancel</Button>
                    <Button onClick={handleSubmit} disabled={!message.trim()}>
                        Submit
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
