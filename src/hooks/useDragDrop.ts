/**
 * Hook for drag-and-drop functionality
 */

import { useState, useCallback } from 'react';

export function useDragDrop<T extends { id: string }>(items: T[], onReorder: (items: T[]) => void) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === index) return;

    const newItems = [...items];
    const draggedItem = newItems[draggedIndex];

    // Remove dragged item
    newItems.splice(draggedIndex, 1);

    // Insert at new position
    newItems.splice(index, 0, draggedItem);

    onReorder(newItems);
    setDraggedIndex(index);
  }, [draggedIndex, items, onReorder]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  return {
    draggedIndex,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
}
