import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/common/CustomToast';

export const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUserFromTokens } = useAuth();
  const toast = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');
      const error = searchParams.get('error');

      if (error) {
        toast.error('Google Sign-In failed. Please try again.');
        navigate('/login');
        return;
      }

      if (accessToken && refreshToken) {
        try {
          // Store tokens and fetch user data
          await setUserFromTokens(accessToken, refreshToken);
          navigate('/dashboard');
        } catch (error) {
          console.error('Error setting user from tokens:', error);
          toast.error('Failed to complete sign in. Please try again.');
          navigate('/login');
        }
      } else {
        toast.error('Missing authentication tokens. Please try again.');
        navigate('/login');
      }
    };

    handleCallback();
  }, [searchParams, navigate, setUserFromTokens]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
};
