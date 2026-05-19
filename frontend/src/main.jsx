import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Patch Node.prototype.removeChild to prevent crashes when external libraries (like Lucide) replace DOM nodes
const originalRemoveChild = Node.prototype.removeChild;
Node.prototype.removeChild = function (child) {
  if (child.parentNode !== this) {
    console.warn('removeChild: Node to be removed is not a child of this node.', child, this);
    return child;
  }
  return originalRemoveChild.call(this, child);
};

// Patch Node.prototype.insertBefore to prevent crashes when reference node is no longer in parent
const originalInsertBefore = Node.prototype.insertBefore;
Node.prototype.insertBefore = function (newNode, referenceNode) {
  if (referenceNode && referenceNode.parentNode !== this) {
    console.warn('insertBefore: Reference node is not a child of this node.', referenceNode, this);
    return originalInsertBefore.call(this, newNode, null);
  }
  return originalInsertBefore.call(this, newNode, referenceNode);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

