import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import 'remixicon/fonts/remixicon.css'
import './index.css'
import App from './App.tsx'
import { initializeTheme } from './hooks/ThemeContext'
import { i18nReady } from './i18n'

initializeTheme()

void i18nReady.then(() => {
  const container = document.getElementById('root')!;
  const application = (
    <StrictMode>
      <App />
    </StrictMode>
  );

  if (container.hasAttribute('data-ssg-route')) {
    hydrateRoot(container, application, {
      onRecoverableError(error, errorInfo) {
        console.error('[MPStorys hydration]', error, errorInfo.componentStack);
      },
    });
  } else {
    createRoot(container).render(application);
  }
})
