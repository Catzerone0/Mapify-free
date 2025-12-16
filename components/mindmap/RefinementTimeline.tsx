'use client';

import React, { useState } from 'react';
import { useMindMapStore } from '@/lib/stores/mindmap';
import { Button } from '@/components/Button';
import { 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  GitBranch,
  Zap,
  Eye,
  RotateCcw
} from 'lucide-react';

export interface RefinementStep {
  id: string;
  type: 'expand' | 'regenerate' | 'summarize' | 'layout';
  nodeId?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  timestamp: Date;
  description: string;
  result?: unknown;
  error?: string | unknown;
  isVisible: boolean;
}

export interface RefinementTimelineProps {
  onClose?: () => void;
  steps?: RefinementStep[];
}

export function RefinementTimeline({ onClose, steps: externalSteps }: RefinementTimelineProps) {
  const { editorSettings } = useMindMapStore();

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
        return Clock; // We'll render the spinner separately
      case 'completed':
        return CheckCircle;
      case 'failed':
        return XCircle;
      default:
        return AlertCircle;
    }
  };

  const getStatusColor = (status: RefinementStep['status']) => {
    switch (status) {
      case 'pending':
        return 'text-gray-400';
      case 'processing':
        return 'text-blue-500';
      case 'completed':
        return 'text-green-500';
      case 'failed':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  const toggleStepVisibility = (stepId: string) => {
    setSteps((prev: RefinementStep[]) => 
      prev.map(step => 
        step.id === stepId 
          ? { ...step, isVisible: !step.isVisible }
          : step
      )
    );
  };

  const handleAcceptStep = (step: RefinementStep) => {
    if (step.result) {
      // Apply the step result to the mind map
      // This would typically update the mind map with the new data
      console.log('Accepting step result:', step.result);
    }
  };

  const handleRejectStep = (step: RefinementStep) => {
    // Remove the step from history
    setSteps((prev: RefinementStep[]) => 
      prev.filter(s => s.id !== step.id)
    );
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  const formatNodeTitle = (nodeId: string) => {
    // Find the node in the mind map and return its title
    // This is a placeholder since we don't have access to mindMap in this component
    return 'Node ' + nodeId.substring(0, 8);
  };

  return (
    <div className={`fixed bottom-4 right-4 w-96 rounded-lg shadow-lg border p-4 ${
      editorSettings.theme === 'dark'
        ? 'bg-gray-800 border-gray-700 text-gray-100'
        : 'bg-white border-gray-200 text-gray-900'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Refinement History
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-1 rounded hover:bg-opacity-20 ${
              editorSettings.theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className={`p-1 rounded hover:bg-opacity-20 ${
                editorSettings.theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {steps.length === 0 ? (
            <div className={`text-center py-4 ${
              editorSettings.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No refinement steps yet</p>
              <p className="text-xs mt-1">AI operations will appear here</p>
            </div>
          ) : (
            steps.map((step) => {
              const Icon = getStepIcon(step);
              const StatusIconComponent = getStatusIcon(step.status);
              
              return (
                <div
                  key={step.id}
                  className={`border rounded-lg p-3 ${
                    step.status === 'processing' 
                      ? 'border-blue-300 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20' 
                      : step.status === 'completed'
                      ? 'border-green-300 bg-green-50 dark:border-green-600 dark:bg-green-900/20'
                      : step.status === 'failed'
                      ? 'border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20'
                      : editorSettings.theme === 'dark'
                      ? 'border-gray-600 bg-gray-700'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 mt-0.5 ${getStatusColor(step.status)}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium">{step.description}</h4>
                          {step.nodeId && (
                            <p className="text-xs opacity-75 mt-1">
                              Node: {formatNodeTitle(step.nodeId)}
                            </p>
                          )}
                          <p className="text-xs opacity-50 mt-1">
                            {formatTime(step.timestamp)}
                          </p>
                        </div>
                        
                        <div className={`flex-shrink-0 ml-2 ${getStatusColor(step.status)}`}>
                          {step.status === 'processing' ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-500" />
                          ) : (
                            <StatusIconComponent className="h-3 w-3" />
                          )}
                        </div>
                      </div>
                      
                      {/* Error message */}
                      {step.error && (
                        <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-400">
                          {typeof step.error === 'string' ? step.error : 'An error occurred'}
                        </div>
                      )}
                      
                      {/* Result preview */}
                      {step.result && step.status === 'completed' && (
                        <div className="mt-2">
                          <button
                            onClick={() => toggleStepVisibility(step.id)}
                            className={`text-xs flex items-center gap-1 ${
                              editorSettings.theme === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'
                            }`}
                          >
                            {step.isVisible ? (
                              <>
                                <Eye className="h-3 w-3" />
                                Hide result
                              </>
                            ) : (
                              <>
                                <Eye className="h-3 w-3" />
                                Show result
                              </>
                            )}
                          </button>
                          
                          {step.isVisible && (
                            <div className={`mt-2 p-2 rounded text-xs ${
                              editorSettings.theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
                            }`}>
                              <pre className="whitespace-pre-wrap overflow-x-auto">
                                {JSON.stringify(step.result, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Action buttons for completed steps */}
                      {step.status === 'completed' && step.result && (
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
                            className="text-xs text-red-600 hover:bg-red-50"
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Summary footer */}
      {steps.length > 0 && (
        <div className={`mt-3 pt-3 border-t text-xs ${
          editorSettings.theme === 'dark' ? 'border-gray-600 text-gray-400' : 'border-gray-200 text-gray-500'
        }`}>
          <div className="flex items-center justify-between">
            <span>{steps.length} step{steps.length !== 1 ? 's' : ''}</span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                {steps.filter(s => s.status === 'completed').length}
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                {steps.filter(s => s.status === 'failed').length}
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                {steps.filter(s => s.status === 'processing').length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}