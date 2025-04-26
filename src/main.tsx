
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n';

// Initialize the root element and render our application
createRoot(document.getElementById("root")!).render(<App />);
