'use client';

import React from 'react';
import { UserPresenceData } from '@/lib/websocket/socket-server';

interface PresenceIndicatorsProps {
  presenceList: UserPresenceData[];
  currentUserId?: string;
}

export function PresenceIndicators({ presenceList, currentUserId }: PresenceIndicatorsProps) {
  // Filter out current user
  const otherUsers = presenceList.filter((p) => p.userId !== currentUserId);

  if (otherUsers.length === 0) {
    return null;
  }

  return (
    <div className="absolute top-4 right-4 flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2">
      <span className="text-sm text-gray-600 dark:text-gray-300 mr-2">Active:</span>
      {otherUsers.map((user) => (
        <div
          key={user.userId}
          className="flex items-center gap-1 px-2 py-1 rounded-full"
          style={{ backgroundColor: `${user.color}20`, border: `2px solid ${user.color}` }}
          title={user.userName}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: user.color }}
          />
          <span className="text-xs font-medium" style={{ color: user.color }}>
            {user.userName}
          </span>
        </div>
      ))}
    </div>
  );
}

interface CursorIndicatorProps {
  userId: string;
  userName: string;
  cursorX: number;
  cursorY: number;
  color: string;
}

export function CursorIndicator({ userName, cursorX, cursorY, color }: CursorIndicatorProps) {
  return (
    <div
      className="absolute pointer-events-none z-50 transition-all duration-100"
      style={{
        left: cursorX,
        top: cursorY,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* Cursor */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
      >
        <path
          d="M5.65376 12.3673L8.93352 14.8153L11.6286 19.5443L13.5706 18.6053L10.8755 13.8763L15.4653 14.9263L5.65376 12.3673Z"
          fill={color}
        />
      </svg>
      
      {/* Name label */}
      <div
        className="absolute left-6 top-0 px-2 py-1 rounded text-xs font-medium text-white whitespace-nowrap"
        style={{ backgroundColor: color }}
      >
        {userName}
      </div>
    </div>
  );
}
