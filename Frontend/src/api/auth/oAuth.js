

export default function oAuthGoogleRedirectionUrl(isSignIn) {
    window.location.href = isSignIn ?  "/api/google/login" : "/api/google/registor"
  };
