# app/datastructs.py
from typing import Optional, List, Any

class Node:
    def __init__(self, data: Any):
        self.data = data
        self.next: Optional['Node'] = None
        self.prev: Optional['Node'] = None

class DoublyLinkedList:
    def __init__(self):
        self.head: Optional[Node] = None
        self.tail: Optional[Node] = None
        self.current: Optional[Node] = None
        self._size = 0
    
    def append(self, data: Any) -> None:
        """Add element to the end of the list"""
        new_node = Node(data)
        
        if not self.head:
            self.head = self.tail = self.current = new_node
        else:
            new_node.prev = self.tail
            if self.tail:
                self.tail.next = new_node
            self.tail = new_node
        
        self._size += 1
    
    def prepend(self, data: Any) -> None:
        """Add element to the beginning of the list"""
        new_node = Node(data)
        
        if not self.head:
            self.head = self.tail = self.current = new_node
        else:
            new_node.next = self.head
            if self.head:
                self.head.prev = new_node
            self.head = new_node
        
        self._size += 1
    
    def next(self) -> Optional[Any]:
        """Move to next element and return its data"""
        if not self.current or not self.current.next:
            return None
        
        self.current = self.current.next
        return self.current.data
    
    def prev(self) -> Optional[Any]:
        """Move to previous element and return its data"""
        if not self.current or not self.current.prev:
            return None
        
        self.current = self.current.prev
        return self.current.data
    
    def current_data(self) -> Optional[Any]:
        """Get current element data"""
        return self.current.data if self.current else None
    
    def size(self) -> int:
        """Get the size of the list"""
        return self._size
    
    def is_empty(self) -> bool:
        """Check if list is empty"""
        return self._size == 0
    
    def to_list(self) -> List[Any]:
        """Convert to regular Python list"""
        result = []
        current = self.head
        while current:
            result.append(current.data)
            current = current.next
        return result

class Stack:
    def __init__(self):
        self._items = []

    def push(self, item: Any):
        self._items.append(item)

    def pop(self) -> Optional[Any]:
        if not self._items:
            return None
        return self._items.pop()

    def peek(self) -> Optional[Any]:
        return self._items[-1] if self._items else None

    def __len__(self):
        return len(self._items)

class Queue:
    def __init__(self):
        self.items: List[Any] = []
    
    def enqueue(self, item: Any) -> None:
        """Add item to the end of the queue"""
        self.items.append(item)
    
    def dequeue(self) -> Optional[Any]:
        """Remove and return item from the front of the queue"""
        if self.is_empty():
            return None
        return self.items.pop(0)
    
    def front(self) -> Optional[Any]:
        """Get the front item without removing it"""
        if self.is_empty():
            return None
        return self.items[0]
    
    def is_empty(self) -> bool:
        """Check if queue is empty"""
        return len(self.items) == 0
    
    def size(self) -> int:
        """Get the size of the queue"""
        return len(self.items)
