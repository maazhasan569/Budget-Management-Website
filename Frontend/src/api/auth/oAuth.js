

export default function oAuthGoogleRedirectionUrl(isSignIn) {
   window.location.href = isSignIn
  ? "/api/v1/auth/google/login"
  : "/api/v1/auth/google/registor";
  };
