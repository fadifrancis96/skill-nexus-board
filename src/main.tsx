
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n';

// Wait for the DOM to be loaded before rendering
document.addEventListener('DOMContentLoaded', () => {
  // Initialize the root element and render our application
  createRoot(document.getElementById("root")!).render(<App />);
});
