import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    CheckCircle2,
    XCircle,
    ArrowRight,
    ArrowLeft,
    AlertTriangle
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

type ChecklistItem = Database['public']['Tables']['checklist_items']['Row'];

interface ChecklistRunnerProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ChecklistRunner = ({ isOpen, onClose }: ChecklistRunnerProps) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [result, setResult] = useState<'success' | 'failure' | null>(null);
    const [failureReason, setFailureReason] = useState<string | null>(null);

    // Fetch checklist configuration
    const { data: questions, isLoading } = useQuery({
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
        enabled: !!user && isOpen,
    });

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setCurrentStep(0);
            setAnswers({});
            setResult(null);
            setFailureReason(null);
        }
    }, [isOpen]);

    const handleAnswer = (answer: any, autoAdvance = false) => {
        if (!questions) return;

        const currentQuestion = questions[currentStep];
        setAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }));

        // If auto-advance is enabled (for click buttons), strictly validate or move next
        if (autoAdvance) {
            validateAndMove(answer);
        }
    };

    const validateAndMove = (answerToCheck: any) => {
        if (!questions) return;

        const currentQuestion = questions[currentStep];

        // Specific validation for required answers
        if (currentQuestion.required_answer) {
            // Strict equality check for required answer
            if (String(answerToCheck) !== String(currentQuestion.required_answer)) {
                setFailureReason(`This trade is blocked because you answered "${answerToCheck}" to "${currentQuestion.question}". The required answer is "${currentQuestion.required_answer}".`);
                setResult('failure');
                return;
            }
        }

        if (currentStep < questions.length - 1) {
            // Small delay for better UX so the user sees the click registration
            setTimeout(() => {
                setCurrentStep(prev => prev + 1);
            }, 100);
        } else {
            setTimeout(() => {
                setResult('success');
            }, 100);
        }
    }

    const handleNext = () => {
        if (!questions) return;

        const currentQuestion = questions[currentStep];
        const currentAnswer = answers[currentQuestion.id];

        // When manually clicking next (text input, or confirming selection), validate the existing answer
        if (currentAnswer !== undefined && currentAnswer !== null && String(currentAnswer).trim() !== '') {
            validateAndMove(currentAnswer);
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    if (isLoading) return null;

    const currentQuestion = questions?.[currentStep];
    const progress = questions ? ((currentStep + 1) / questions.length) * 100 : 0;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[600px] p-0 bg-background border border-white/10 overflow-hidden">

                {result ? (
                    <div className="p-8 flex flex-col items-center justify-center text-center min-h-[400px] animate-in fade-in zoom-in duration-300">
                        {result === 'success' ? (
                            <>
                                <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6 ring-4 ring-emerald-500/10">
                                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                                </div>
                                <h2 className="text-2xl font-bold mb-2">You are ready to trade</h2>
                                <p className="text-muted-foreground mb-8 max-w-xs mx-auto">
                                    All checklist criteria have been met. Good luck!
                                </p>
                                <Button onClick={onClose} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white">
                                    Enter Room
                                </Button>
                            </>
                        ) : (
                            <>
                                <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center mb-6 ring-4 ring-destructive/10">
                                    <XCircle className="w-10 h-10 text-destructive" />
                                </div>
                                <h2 className="text-2xl font-bold mb-2">Trade Blocked</h2>
                                <p className="text-destructive/80 mb-8 max-w-sm mx-auto font-medium bg-destructive/10 p-4 rounded-lg text-sm">
                                    {failureReason}
                                </p>
                                <div className="flex gap-3 w-full">
                                    <Button variant="outline" onClick={onClose} className="flex-1">
                                        Cancel Trade
                                    </Button>
                                    <Button variant="ghost" onClick={() => { setResult(null); setCurrentStep(0); setFailureReason(null); }} className="flex-1">
                                        Try Again
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                ) : questions && questions.length > 0 ? (
                    <div className="flex flex-col min-h-[500px]">
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-border/10">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                    Question {currentStep + 1} of {questions.length}
                                </span>
                                <span className="text-xs font-mono text-muted-foreground">
                                    {Math.round(progress)}%
                                </span>
                            </div>
                            <Progress value={progress} className="h-1" />
                        </div>

                        {/* Question Body */}
                        <div className="flex-1 px-8 py-8 flex flex-col justify-center">
                            <h3 className="text-2xl font-semibold mb-8 animate-in slide-in-from-right-4 fade-in duration-300 transform">
                                {currentQuestion?.question}
                            </h3>

                            <div className="space-y-4 animate-in slide-in-from-bottom-4 fade-in duration-500 delay-100 fill-mode-backwards">
                                {currentQuestion?.type === 'yes_no' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            onClick={() => handleAnswer('Yes', true)}
                                            className={cn(
                                                "p-6 rounded-xl border-2 transition-all duration-200 text-lg font-medium",
                                                answers[currentQuestion.id] === 'Yes'
                                                    ? "border-primary bg-primary/10 text-primary"
                                                    : "border-border/30 hover:border-primary/50 hover:bg-white/5"
                                            )}
                                        >
                                            Yes
                                        </button>
                                        <button
                                            onClick={() => handleAnswer('No', true)}
                                            className={cn(
                                                "p-6 rounded-xl border-2 transition-all duration-200 text-lg font-medium",
                                                answers[currentQuestion.id] === 'No'
                                                    ? "border-primary bg-primary/10 text-primary"
                                                    : "border-border/30 hover:border-primary/50 hover:bg-white/5"
                                            )}
                                        >
                                            No
                                        </button>
                                    </div>
                                )}

                                {currentQuestion?.type === 'multiple_choice' && (
                                    <div className="grid grid-cols-1 gap-3">
                                        {/* Assuming options is an array of strings in JSON */}
                                        {Array.isArray(currentQuestion.options) && currentQuestion.options.map((opt: string) => (
                                            <button
                                                key={opt}
                                                onClick={() => handleAnswer(opt, true)}
                                                className={cn(
                                                    "p-4 rounded-xl border-2 text-left transition-all duration-200 font-medium",
                                                    answers[currentQuestion.id] === opt
                                                        ? "border-primary bg-primary/10 text-primary"
                                                        : "border-border/30 hover:border-primary/50 hover:bg-white/5"
                                                )}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {currentQuestion?.type === 'text' && (
                                    <Input
                                        autoFocus
                                        value={answers[currentQuestion.id] || ''}
                                        onChange={(e) => handleAnswer(e.target.value, false)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleNext();
                                        }}
                                        className="text-lg p-6"
                                        placeholder="Type your answer..."
                                    />
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-6 border-t border-border/10 flex justify-between items-center bg-card/30">
                            <Button
                                variant="ghost"
                                onClick={handlePrevious}
                                disabled={currentStep === 0}
                                className="text-muted-foreground hover:text-white"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                            </Button>

                            <Button
                                onClick={handleNext}
                                disabled={!answers[currentQuestion?.id]}
                                className="px-8"
                            >
                                {currentStep === questions.length - 1 ? 'Finish' : 'Next'} <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="p-12 text-center text-muted-foreground">
                        <AlertTriangle className="mx-auto h-12 w-12 mb-4 opacity-50" />
                        <h3 className="text-lg font-medium text-white mb-2">No Checklist Found</h3>
                        <p>You haven't set up your trading checklist yet.</p>
                        <Button className="mt-4" onClick={() => { onClose(); navigate('/checklist'); }}>
                            Create Checklist
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
