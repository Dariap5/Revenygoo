import { OnboardingHeader } from "@/components/onboarding/onboarding-header";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <OnboardingHeader />
      <div className="flex flex-1 flex-col items-center justify-center px-5 py-8">
        <OnboardingWizard />
      </div>
    </div>
  );
}
