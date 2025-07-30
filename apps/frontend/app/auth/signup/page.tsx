import { AuthForm } from "@/components/AuthPage";
import { InternalHeader } from "@/components/InternalHeader";

export default function SignUp() {
  return (
    <div>
      <InternalHeader />
      <AuthForm type="signup" />
    </div>
  );
}