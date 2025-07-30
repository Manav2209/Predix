import { AuthForm } from "@/components/AuthPage";
import { InternalHeader } from "@/components/InternalHeader";

export default function SignIn() {
  return (
    <div>
      <InternalHeader />
      <AuthForm type="signin" />
    </div>
  );
}