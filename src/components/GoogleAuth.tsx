import React, { useEffect, useState, useRef } from 'react';
import { CONFIG } from '../config';
import './GoogleAuth.css';

interface GoogleAuthProps {
  onLogin: (user: any) => void;
  onLogout: () => void;
  isAuthenticated: boolean;
  user: any;
}

declare global {
  interface Window {
    google: any;
  }
}

const GoogleAuth: React.FC<GoogleAuthProps> = ({ onLogin, onLogout, isAuthenticated, user }) => {
  const [isLoading, setIsLoading] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Google Identity Services script
    const loadGoogleScript = () => {
      if (window.google) {
        initializeGoogleAuth();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleAuth;
      document.head.appendChild(script);
    };

    const initializeGoogleAuth = () => {
      if (window.google && CONFIG.GOOGLE_CLIENT_ID) {
        window.google.accounts.id.initialize({
          client_id: CONFIG.GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
          error_callback: handleError,
          use_fedcm_for_prompt: false, // Disable FedCM to use redirect flow
          itp_support: true
          // ux_mode: 'popup' // Use redirect mode by default (more reliable)
        });

        // Render button in the hidden container when ready
        // Use a small delay to ensure the ref is set
        setTimeout(() => {
          if (buttonRef.current) {
            try {
              window.google.accounts.id.renderButton(buttonRef.current, {
                type: 'standard',
                theme: 'outline',
                size: 'large',
                text: 'signin_with',
                width: '250',
                callback: handleCredentialResponse,
              });
            } catch (error) {
              console.error('Error rendering Google button:', error);
            }
          }
        }, 100);
      }
    };

    loadGoogleScript();
  }, []);

  const handleCredentialResponse = (response: any) => {
    setIsLoading(true);
    
    // Decode JWT token to get user info
    try {
      if (!response || !response.credential) {
        console.error('Invalid credential response:', response);
        alert('Invalid login response. Please try again.');
        setIsLoading(false);
        return;
      }

      // Decode JWT token
      const parts = response.credential.split('.');
      if (parts.length !== 3) {
        console.error('Invalid JWT format:', response.credential.substring(0, 50));
        alert('Invalid login token format. Please try again.');
        setIsLoading(false);
        return;
      }

      const payload = JSON.parse(atob(parts[1]));
      console.log('Decoded JWT payload:', payload);
      
      if (!payload.email) {
        console.error('Email not found in JWT payload:', payload);
        alert('Email information not found in login response. Please try again.');
        setIsLoading(false);
        return;
      }
      
      const userInfo = {
        email: (payload.email || '').trim().toLowerCase(),
        name: payload.name || '',
        picture: payload.picture || '',
        sub: payload.sub || ''
      };
      
      console.log('User info extracted:', { ...userInfo, email: userInfo.email });
      
      // Check domain before attempting login
      if (!userInfo.email.endsWith('@mangoforsalon.com')) {
        alert('Only emails with @mangoforsalon.com domain are allowed.');
        setIsLoading(false);
        return;
      }
      
      onLogin(userInfo);
    } catch (error) {
      console.error('Error processing login information:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        response: response ? { hasCredential: !!response.credential } : null
      });
      alert('Error processing login information. Please try again. If the problem persists, please contact support.');
      setIsLoading(false);
    }
  };

  const handleError = (error: any) => {
    setIsLoading(false);
    
    // Ignore common user cancellation errors
    if (
      error.type === 'popup_closed' || 
      error.type === 'abort' ||
      error.name === 'AbortError' ||
      error.message?.includes('AbortError') ||
      error.message?.includes('signal is aborted') ||
      error.message?.includes('The given origin is not allowed') ||
      error.message?.includes('FedCM was disabled') ||
      error.message?.includes('NetworkError')
    ) {
      // User cancelled or FedCM disabled - no need to show error
      return;
    }
    
    // Log other errors for debugging
    console.error('Google Sign-In error:', error);
  };

  const handleLogin = () => {
    if (!window.google || !window.google.accounts) {
      console.error('Google Identity Services not loaded');
      alert('Google Sign-In is not available. Please refresh the page.');
      return;
    }

    setIsLoading(true);

    try {
      // Try to click the rendered Google button directly
      if (buttonRef.current) {
        // Find the iframe or button element
        const iframe = buttonRef.current.querySelector('iframe');
        const button = buttonRef.current.querySelector('div[role="button"]') as HTMLElement;
        
        if (iframe) {
          // Try to click the iframe - this should work if it's in the same origin context
          // But if it's cross-origin, we need to use a different approach
          try {
            // Create a pointer event to simulate user click
            const rect = iframe.getBoundingClientRect();
            const clickEvent = new MouseEvent('click', {
              view: window,
              bubbles: true,
              cancelable: true,
              clientX: rect.left + rect.width / 2,
              clientY: rect.top + rect.height / 2
            });
            
            // Try to dispatch on iframe
            iframe.dispatchEvent(clickEvent);
            
            // Also try direct click
            iframe.click();
          } catch (e) {
            console.log('Direct iframe click failed, trying alternative method:', e);
            // Alternative: Use the button container if available
            if (button) {
              button.click();
            } else {
              // Last resort: use prompt
              window.google.accounts.id.prompt();
            }
          }
        } else if (button) {
          button.click();
        } else {
          // Button not rendered yet, wait and retry
          setTimeout(() => {
            const retryIframe = buttonRef.current?.querySelector('iframe');
            const retryButton = buttonRef.current?.querySelector('div[role="button"]') as HTMLElement;
            
            if (retryIframe) {
              retryIframe.click();
            } else if (retryButton) {
              retryButton.click();
            } else {
              setIsLoading(false);
              // Use prompt as fallback
              window.google.accounts.id.prompt((notification: any) => {
                setIsLoading(false);
                if (notification.isNotDisplayed()) {
                  const reason = notification.getNotDisplayedReason();
                  console.log('One Tap not displayed:', reason);
                  alert('Google Sign-In popup could not be opened. Please try again.');
                }
              });
            }
          }, 500);
        }
      } else {
        setIsLoading(false);
        alert('Google Sign-In is not initialized. Please refresh the page.');
      }
    } catch (error) {
      console.error('Error triggering login:', error);
      setIsLoading(false);
      handleError(error);
    }
  };


  if (isAuthenticated) {
    return null; // Không hiển thị gì khi đã đăng nhập
  }

  return (
    <div className="google-auth-container" style={{ position: 'relative', display: 'inline-block' }}>
      {/* Custom styled button - visible layer */}
      <button 
        className="google-login-btn"
        disabled={isLoading}
        style={{ 
          position: 'relative', 
          zIndex: 1,
          pointerEvents: 'none' // Make it non-interactive, just visual
        }}
      >
        {isLoading ? (
          <div className="spinner-small"></div>
        ) : (
          <>
            <svg className="google-icon" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </>
        )}
      </button>
      
      {/* Google's rendered button - invisible but receives all clicks */}
      <div 
        ref={buttonRef}
        onClick={() => {
          // This will be handled by Google's button
          setIsLoading(true);
        }}
        style={{ 
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          opacity: 0,
          zIndex: 2,
          pointerEvents: 'auto',
          cursor: 'pointer'
        }}
      />
    </div>
  );
};

export default GoogleAuth;
