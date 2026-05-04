"use client";

import React from 'react';
import { useParams } from 'next/navigation';

export default function ToolPage() {
  const params = useParams();
  const toolSlug = params?.toolSlug || '';
  
  const toolName = toolSlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <div>
      <div className="tool-header">
        <h1>{toolName}</h1>
      </div>
      
      <div className="tool-card">
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Coming Soon</h2>
        <p className="tool-description">
          We are currently working hard to bring you the best {toolName} functionality. Please check back later!
        </p>
      </div>
    </div>
  );
}
