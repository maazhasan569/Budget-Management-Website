
import { API_BASE_URL } from "@/api/axiosClient"

export default function oAuthGoogleRedirectionUrl(isSignIn) {
  window.location.href = isSignIn
    ? `${API_BASE_URL}/auth/google/login`
    : `${API_BASE_URL}/auth/google/registor`
}
