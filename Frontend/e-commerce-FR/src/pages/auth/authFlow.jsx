import { useState } from "react";
import AuthEmail from "./authEmail";
import AuthOTP from "./authOtp";

export default function AuthFlow() {
  const [email, setEmail] = useState(null);

  if (!email) return <AuthEmail onSent={setEmail} />;
  return <AuthOTP email={email} onVerify={() => alert("Logged in!")} />;
}
