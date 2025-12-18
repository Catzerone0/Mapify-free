'use client';

import React, { useState } from 'react';
import { Button } from '@/components/Button';
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Eye,
  GitBranch,
  RotateCcw,
  XCircle,
  Zap,
} from 'lucide-react';

export interface RefinementStep {
  id: string;
  type: 'expand' | 'regenerate' | 'summarize' | 'layout';
  nodeId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  timestamp: Date;
  description: string;
  result?: unknown;
  error?: string;
  isVisible: boolean;
}

export interface RefinementTimelineProps {
  onClose?: () => void;
  steps?: RefinementStep[];
}

export function RefinementTimeline({ onClose, steps: externalSteps }: RefinementTimelineProps) {
  const [internalSteps, setInternalSteps] = useState<RefinementStep[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);

  const steps = externalSteps || internalSteps;
  const setSteps = externalSteps ? (() => {}) : setInternalSteps;

  const getStepIcon = (step: RefinementStep) => {
    switch (step.type) {
      case 'expand':
        return GitBranch;
      case 'regenerate':
        return RotateCcw;
      case 'summarize':
        return Zap;
      case 'layout':
        return Eye;
      default:
        return Clock;
    }
  };

  const getStatusIcon = (status: RefinementStep['status']) => {
    switch (status) {
      case 'pending':
        return Clock;
      case 'processing':
        return Clock;
      case 'completed':
        return CheckCircle;
      case 'failed':
        return XCircle;
      default:
        return AlertCircle;
    }
  };

  const getStatusClasses = (status: RefinementStep['status']) => {
    switch (status) {
      case 'pending':
        return {
          text: 'text-foreground-secondary',
          container: 'border-border bg-secondary',
        };
      case 'processing':
        return {
          text: 'text-primary',
          container: 'border-primary/30 bg-primary/10',
        };
      case 'completed':
        return {
          text: 'text-success',
          container: 'border-success/30 bg-success/10',
        };
      case 'failed':
        return {
          text: 'text-error',
          container: 'border-error/30 bg-error/10',
        };
      default:
        return {
          text: 'text-foreground-secondary',
          container: 'border-border bg-secondary',
        };
    }
  };

  const toggleStepVisibility = (stepId: string) => {
    setSteps((prev: RefinementStep[]) =>
      prev.map((step) => (step.id === stepId ? { ...step, isVisible: !step.isVisible } : step))
    );
  };

  const handleAcceptStep = (step: RefinementStep) => {
    if (step.result) {
      console.log('Accepting step result:', step.result);
    }
  };

  const handleRejectStep = (step: RefinementStep) => {
    setSteps((prev: RefinementStep[]) => prev.filter((s) => s.id !== step.id));
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  const formatNodeTitle = (nodeId: string) => {
    return 'Node ' + nodeId.substring(0, 8);
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 rounded-md shadow-elevation-2 border border-border bg-popover text-popover-foreground p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Refinement History
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded hover:bg-accent transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-accent transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {steps.length === 0 ? (
            <div className="text-center py-4 text-foreground-secondary">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No refinement steps yet</p>
              <p className="text-small mt-1">AI operations will appear here</p>
            </div>
          ) : (
            steps.map((step) => {
              const Icon = getStepIcon(step);
              const StatusIconComponent = getStatusIcon(step.status);
              const status = getStatusClasses(step.status);

              return (
                <div
                  key={step.id}
                  className={[
                    'border rounded-md p-3',
                    status.container,
                  ].join(' ')}
                >
                  <div className="flex items-start gap-3">
                    <div className={['flex-shrink-0 mt-0.5', status.text].join(' ')}>
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium">{step.description}</h4>
                          {step.nodeId && (
                            <p className="text-small text-foreground-secondary mt-1">
                              Node: {formatNodeTitle(step.nodeId)}
                            </p>
                          )}
                          <p className="text-xs text-foreground-secondary/70 mt-1">
                            {formatTime(step.timestamp)}
                          </p>
                        </div>

                        <div className={['flex-shrink-0', status.text].join(' ')}>
                          {step.status === 'processing' ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b border-primary" />
                          ) : (
                            <StatusIconComponent className="h-3 w-3" />
                          )}
                        </div>
                      </div>

                      {step.error && (
                        <div className="mt-2 p-2 bg-error/10 border border-error/30 rounded text-small text-error">
                          {step.error}
                        </div>
                      )}

                      {step.result && step.status === 'completed' ? (
                        <div className="mt-2">
                          <button
                            onClick={() => toggleStepVisibility(step.id)}
                            className="text-small text-foreground-secondary hover:text-foreground flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3" />
                            {step.isVisible ? 'Hide result' : 'Show result'}
                          </button>

                          {step.isVisible && (
                            <div className="mt-2 p-2 rounded border border-border bg-background text-xs">
                              <pre className="whitespace-pre-wrap overflow-x-auto">
                                {JSON.stringify(step.result, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      ) : null}

                      {step.status === 'completed' && step.result ? (
                        <div className="flex gap-2 mt-2">
                          <Button
                            onClick={() => handleAcceptStep(step)}
                            size="sm"
                            variant="outline"
                            className="text-xs"
                          >
                            Accept
                          </Button>
                          <Button
                            onClick={() => handleRejectStep(step)}
                            size="sm"
                            variant="outline"
                            className="text-xs text-error hover:bg-error/10"
                          >
                            Reject
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {steps.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border text-xs text-foreground-secondary">
          <div className="flex items-center justify-between">
            <span>
              {steps.length} step{steps.length !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-success rounded-full" />
                {steps.filter((s) => s.status === 'completed').length}
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-error rounded-full" />
                {steps.filter((s) => s.status === 'failed').length}
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-primary rounded-full" />
                {steps.filter((s) => s.status === 'processing').length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
