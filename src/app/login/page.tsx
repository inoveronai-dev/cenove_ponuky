import { isDemoMode } from "@/lib/demo/mode";
import { LoginForm } from "@/app/login/login-form";

export default function LoginPage() {
  return <LoginForm demoAvailable={isDemoMode()} />;
}
