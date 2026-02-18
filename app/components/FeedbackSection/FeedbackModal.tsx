'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { auth } from '../../hooks/userAuth';
import { useFeedback, FeedbackContent, UseFeedbackReturn } from './FeedbackSection';

interface FeedbackModalProps {
  recipeId: string;
  delayMs?: number;
  sharedFeedback?: UseFeedbackReturn;
}

const FEEDBACK_DISMISSED_KEY = 'feedback_modal_dismissed';

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ recipeId, delayMs = 30000, sharedFeedback }) => {
  const [isOpen, setIsOpen] = useState(false);
  const localFeedback = useFeedback(recipeId);
  const feedbackProps = sharedFeedback || localFeedback;

  const wasDismissed = useCallback(() => {
    try {
      const dismissed = sessionStorage.getItem(`${FEEDBACK_DISMISSED_KEY}_${recipeId}`);
      return dismissed === 'true';
    } catch {
      return false;
    }
  }, [recipeId]);

  const markDismissed = useCallback(() => {
    try {
      sessionStorage.setItem(`${FEEDBACK_DISMISSED_KEY}_${recipeId}`, 'true');
    } catch {}
  }, [recipeId]);

  useEffect(() => {
    // Don't show if: not logged in, already has feedback, already dismissed, or still loading
    if (feedbackProps.isLoading) return;
    if (!auth.currentUser?.uid) return;
    if (feedbackProps.feedback !== null) return;
    if (wasDismissed()) return;

    const timer = setTimeout(() => {
      // Re-check in case user gave feedback via the inline section during the wait
      if (feedbackProps.feedback === null && !wasDismissed()) {
        setIsOpen(true);
      }
    }, delayMs);

    return () => clearTimeout(timer);
  }, [feedbackProps.isLoading, feedbackProps.feedback, delayMs, wasDismissed]);

  // Close modal after feedback is given (thumbs up)
  useEffect(() => {
    if (feedbackProps.feedback === 'up') {
      setTimeout(() => {
        setIsOpen(false);
        markDismissed();
      }, 500);
    }
  }, [feedbackProps.feedback, markDismissed]);

  // Detect when reason picker transitions from shown → hidden (submitted or skipped)
  const prevShowReasonPickerRef = React.useRef(feedbackProps.showReasonPicker);
  useEffect(() => {
    const wasShowing = prevShowReasonPickerRef.current;
    const isShowing = feedbackProps.showReasonPicker;
    prevShowReasonPickerRef.current = isShowing;

    // Reason flow complete: picker was open, now closed
    if (wasShowing && !isShowing && isOpen) {
      setIsOpen(false);
      markDismissed();
    }
  }, [feedbackProps.showReasonPicker, isOpen, markDismissed]);

  const handleClose = () => {
    setIsOpen(false);
    markDismissed();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="fixed inset-0 bg-black/60" onClick={handleClose} />
      <div className="bg-white rounded-2xl shadow-2xl p-6 z-50 w-full max-w-md animate-fade-in relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="pt-2">
          <FeedbackContent {...feedbackProps} />
        </div>
      </div>
    </div>
  );
};
