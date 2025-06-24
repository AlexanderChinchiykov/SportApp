import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const OAuthCallback = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState({});
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Log that the component has mounted
    console.log('OAuthCallback component mounted');
    
    // Capture URL details for debugging
    const currentUrl = window.location.href;
    const searchParams = location.search;
    const hasCode = new URLSearchParams(searchParams).has('code');
    
    console.log(`Current URL: ${currentUrl}`);
    console.log(`Has code: ${hasCode}`);
    console.log(`Search params: ${searchParams}`);
    
    // Setup debugging info
    const debug = {
      url: currentUrl,
      search: searchParams,
      hasCode: hasCode
    };
    setDebugInfo(debug);
    
    // Extract the authorization code
    const urlParams = new URLSearchParams(searchParams);
    const code = urlParams.get('code');
    
    if (!code) {
      console.error('No authorization code found in URL');
      setError('Authentication failed: No authorization code provided in callback');
      setLoading(false);
      return;
    }
    
    // Function to process the OAuth callback
    const processCode = () => {
      try {
        console.log(`Processing OAuth code: ${code.substring(0, 10)}...`);
        
        // Redirect to the backend Google callback with the code
        const callbackUrl = `/api/v1/auth/google/callback?code=${encodeURIComponent(code)}`;
        console.log(`Redirecting to: ${callbackUrl}`);
        
        // Use direct location change
        window.location.assign(callbackUrl);
      } catch (error) {
        console.error('Error processing OAuth code:', error);
        setError(`Failed to process authentication: ${error.message}`);
        setLoading(false);
      }
    };
    
    // Process the code after a short delay to ensure logging
    setTimeout(processCode, 500);
  }, [location, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center p-8 bg-gray-800 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-white mb-4">Completing Authentication</h1>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-300 mt-4">Please wait while we complete the authentication process...</p>
          <p className="text-gray-400 text-sm mt-2">
            If you're not redirected within 5 seconds, 
            <button 
              onClick={() => {
                const code = new URLSearchParams(location.search).get('code');
                if (code) window.location.href = `/api/v1/auth/google/callback?code=${encodeURIComponent(code)}`;
              }}
              className="text-blue-400 ml-1 underline"
            >
              click here
            </button>
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center p-8 bg-gray-800 rounded-lg shadow-lg max-w-md">
          <h1 className="text-2xl font-bold text-white mb-4">Authentication Failed</h1>
          <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded mb-4">
            {error}
          </div>
          {Object.keys(debugInfo).length > 0 && (
            <div className="bg-gray-700 text-gray-300 text-left p-3 rounded mb-4 text-xs overflow-auto">
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          )}
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default OAuthCallback; 