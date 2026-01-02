import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import SidebarLayout from "@/components/ui/sidebar-component";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
    Plus,
    Trash2,
    MoveUp,
    MoveDown,
    Check,
    X,
    Loader2,
    Pencil,
    ShieldAlert
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

// Type definitions
type ChecklistItem = Database['public']['Tables']['checklist_items']['Row'];
type NewChecklistItem = Database['public']['Tables']['checklist_items']['Insert'];
type QuestionType = 'yes_no' | 'multiple_choice' | 'text';

const ChecklistBuilder = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Add State
    const [newItemText, setNewItemText] = useState("");
    const [newItemType, setNewItemType] = useState<QuestionType>("yes_no");
    const [newItemRequired, setNewItemRequired] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState("");
    const [editType, setEditType] = useState<QuestionType>("yes_no");
    const [editRequired, setEditRequired] = useState<string | null>(null);

    // Fetch items
    const { data: items, isLoading } = useQuery({
        queryKey: ['checklist-items', user?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('checklist_items')
                .select('*')
                .eq('user_id', user!.id)
                .order('display_order', { ascending: true });

            if (error) throw error;
            return data as ChecklistItem[];
        },
        enabled: !!user,
    });

    // Add Mutation
    const addItemMutation = useMutation({
        mutationFn: async (newItem: NewChecklistItem) => {
            const { error } = await supabase
                .from('checklist_items')
                .insert(newItem);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['checklist-items'] });
            setNewItemText("");
            setNewItemRequired(null);
            setIsAdding(false);
            toast.success("Question added successfully");
        },
        onError: (error) => {
            toast.error("Failed to add question: " + error.message);
        }
    });

    // Edit Mutation
    const editItemMutation = useMutation({
        mutationFn: async (item: { id: string, question: string, type: QuestionType, required_answer: string | null }) => {
            const { error } = await supabase
                .from('checklist_items')
                .update({
                    question: item.question,
                    type: item.type,
                    required_answer: item.required_answer
                })
                .eq('id', item.id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['checklist-items'] });
            setEditingId(null);
            toast.success("Question updated");
        },
        onError: (error) => {
            toast.error("Failed to update question: " + error.message);
        }
    });

    // Delete Mutation
    const deleteItemMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('checklist_items')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['checklist-items'] });
            toast.success("Question deleted");
        }
    });

    // Reorder Mutation (Simple Up/Down)
    const updateOrderMutation = useMutation({
        mutationFn: async (itemsToUpdate: { id: string, display_order: number }[]) => {
            for (const item of itemsToUpdate) {
                const { error } = await supabase
                    .from('checklist_items')
                    .update({ display_order: item.display_order })
                    .eq('id', item.id);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['checklist-items'] });
        }
    });

    const handleAddItem = () => {
        if (!newItemText.trim() || !user) return;

        // Calculate next order
        const currentMaxOrder = items?.reduce((max, item) => Math.max(max, item.display_order), 0) || 0;

        addItemMutation.mutate({
            user_id: user.id,
            question: newItemText,
            type: newItemType,
            display_order: currentMaxOrder + 1,
            options: newItemType === 'yes_no' ? ["Yes", "No"] : null,
            required_answer: newItemRequired === "none" ? null : newItemRequired
        });
    };

    const startEditing = (item: ChecklistItem) => {
        setEditingId(item.id);
        setEditText(item.question);
        setEditType(item.type as QuestionType);
        setEditRequired(item.required_answer || "none");
    };

    const saveEdit = () => {
        if (!editingId || !editText.trim()) return;
        editItemMutation.mutate({
            id: editingId,
            question: editText,
            type: editType,
            required_answer: editRequired === "none" ? null : editRequired
        });
    };

    const handleMove = (index: number, direction: 'up' | 'down') => {
        if (!items) return;
        const newItems = [...items];

        if (direction === 'up' && index > 0) {
            // Swap with previous
            const temp = newItems[index].display_order;
            newItems[index].display_order = newItems[index - 1].display_order;
            newItems[index - 1].display_order = temp;

            updateOrderMutation.mutate([
                { id: newItems[index].id, display_order: newItems[index].display_order },
                { id: newItems[index - 1].id, display_order: newItems[index - 1].display_order }
            ]);
        } else if (direction === 'down' && index < newItems.length - 1) {
            // Swap with next
            const temp = newItems[index].display_order;
            newItems[index].display_order = newItems[index + 1].display_order;
            newItems[index + 1].display_order = temp;

            updateOrderMutation.mutate([
                { id: newItems[index].id, display_order: newItems[index].display_order },
                { id: newItems[index + 1].id, display_order: newItems[index + 1].display_order }
            ]);
        }
    };

    const isLimitReached = (items?.length || 0) >= 20;

    return (
        <SidebarLayout>
            <div className="p-8 max-w-4xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Trading Plan</h1>
                    <p className="text-muted-foreground">Define your pre-trade checklist rules (Max 20 questions).</p>
                </header>

                <div className="space-y-4">
                    {/* List of Questions */}
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        items?.map((item, index) => (
                            <React.Fragment key={item.id}>
                                {editingId === item.id ? (
                                    <Card className="p-4 border-2 border-primary/20 bg-card/80">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-sm font-medium mb-1 block">Question</label>
                                                <Input
                                                    autoFocus
                                                    value={editText}
                                                    onChange={(e) => setEditText(e.target.value)}
                                                    className="bg-black/20"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-sm font-medium mb-1 block">Type</label>
                                                    <Select
                                                        value={editType}
                                                        onValueChange={(val) => setEditType(val as QuestionType)}
                                                    >
                                                        <SelectTrigger className="bg-black/20">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="yes_no">Yes / No</SelectItem>
                                                            <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                                                            <SelectItem value="text">Free Text</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                {editType === 'yes_no' && (
                                                    <div>
                                                        <label className="text-sm font-medium mb-1 block flex items-center gap-1.5 text-orange-400">
                                                            <ShieldAlert size={14} /> Trade Allowed If...
                                                        </label>
                                                        <Select
                                                            value={editRequired || "none"}
                                                            onValueChange={setEditRequired}
                                                        >
                                                            <SelectTrigger className="bg-black/20 border-orange-500/30">
                                                                <SelectValue placeholder="Condition" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="none">Any Answer Allowed</SelectItem>
                                                                <SelectItem value="Yes">Must be Yes</SelectItem>
                                                                <SelectItem value="No">Must be No</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex justify-end gap-2 pt-2">
                                                <Button variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                                                <Button onClick={saveEdit} disabled={!editText.trim()}>Save Changes</Button>
                                            </div>
                                        </div>
                                    </Card>
                                ) : (
                                    <Card className="p-4 flex items-center justify-between bg-card/50 backdrop-blur border-white/5 hover:bg-card/80 transition-colors">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="flex flex-col gap-1">
                                                <button
                                                    disabled={index === 0}
                                                    onClick={() => handleMove(index, 'up')}
                                                    className="text-muted-foreground hover:text-white disabled:opacity-30"
                                                >
                                                    <MoveUp size={14} />
                                                </button>
                                                <button
                                                    disabled={index === (items.length - 1)}
                                                    onClick={() => handleMove(index, 'down')}
                                                    className="text-muted-foreground hover:text-white disabled:opacity-30"
                                                >
                                                    <MoveDown size={14} />
                                                </button>
                                            </div>
                                            <div className="flex-1 cursor-pointer" onClick={() => startEditing(item)}>
                                                <div className="flex items-center gap-3">
                                                    <p className="font-medium">{item.question}</p>
                                                    {item.required_answer && (
                                                        <span className="text-[10px] bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded border border-orange-500/20 font-mono uppercase tracking-wider">
                                                            REQ: {item.required_answer}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-xs text-muted-foreground uppercase tracking-wider">{item.type.replace('_', ' ')}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => startEditing(item)}
                                                className="text-muted-foreground hover:text-primary transition-colors"
                                            >
                                                <Pencil size={16} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => deleteItemMutation.mutate(item.id)}
                                                className="text-muted-foreground hover:text-destructive transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </Button>
                                        </div>
                                    </Card>
                                )}
                            </React.Fragment>
                        ))
                    )}

                    {/* Add New Question Section */}
                    {isAdding ? (
                        <Card className="p-4 border-2 border-primary/20 bg-card/80">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium mb-1 block">Question</label>
                                    <Input
                                        autoFocus
                                        value={newItemText}
                                        onChange={(e) => setNewItemText(e.target.value)}
                                        placeholder="e.g. Is the trend aligned with the higher timeframe?"
                                        className="bg-black/20"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium mb-1 block">Type</label>
                                        <Select
                                            value={newItemType}
                                            onValueChange={(val) => { setNewItemType(val as QuestionType); setNewItemRequired("none"); }}
                                        >
                                            <SelectTrigger className="bg-black/20">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="yes_no">Yes / No</SelectItem>
                                                <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                                                <SelectItem value="text">Free Text</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {newItemType === 'yes_no' && (
                                        <div>
                                            <label className="text-sm font-medium mb-1 block flex items-center gap-1.5 text-orange-400">
                                                <ShieldAlert size={14} /> Trade Allowed If...
                                            </label>
                                            <Select
                                                value={newItemRequired || "none"}
                                                onValueChange={setNewItemRequired}
                                            >
                                                <SelectTrigger className="bg-black/20 border-orange-500/30">
                                                    <SelectValue placeholder="Condition" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">Any Answer Allowed</SelectItem>
                                                    <SelectItem value="Yes">Must be Yes</SelectItem>
                                                    <SelectItem value="No">Must be No</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
                                    <Button onClick={handleAddItem} disabled={!newItemText.trim()}>Save Question</Button>
                                </div>
                            </div>
                        </Card>
                    ) : (
                        <Button
                            onClick={() => setIsAdding(true)}
                            disabled={isLimitReached}
                            className="w-full py-8 border-dashed border-2 border-white/10 bg-transparent hover:bg-white/5 text-muted-foreground hover:text-white"
                        >
                            <Plus className="mr-2" /> Add Question {items ? `(${items.length}/20)` : ''}
                        </Button>
                    )}
                </div>
            </div>
        </SidebarLayout>
    );
};

export default ChecklistBuilder;
