import React, { useEffect, useState } from 'react';
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
          use_fedcm_for_prompt: true, // Enable FedCM as required by Google
          itp_support: true // Enable ITP support for better compatibility
        });
      }
    };

    loadGoogleScript();
  }, []);

  const handleCredentialResponse = (response: any) => {
    setIsLoading(true);
    
    // Decode JWT token to get user info
    try {
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      
      const userInfo = {
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        sub: payload.sub
      };
      
      // Check domain before attempting login
      if (!userInfo.email.toLowerCase().endsWith('@mangoforsalon.com')) {
        alert('Only emails with @mangoforsalon.com domain are allowed.');
        setIsLoading(false);
        return;
      }
      
      onLogin(userInfo);
    } catch (error) {
      alert('Error processing login information. Please try again.');
    } finally {
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
    if (window.google) {
      try {
        // Use FedCM as configured
        window.google.accounts.id.prompt();
      } catch (error) {
        handleError(error);
      }
    }
  };


  if (isAuthenticated) {
    return null; // Không hiển thị gì khi đã đăng nhập
  }

  return (
    <div className="google-auth-container">
      <button 
        onClick={handleLogin} 
        className="google-login-btn"
        disabled={isLoading}
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
    </div>
  );
};

export default GoogleAuth;
