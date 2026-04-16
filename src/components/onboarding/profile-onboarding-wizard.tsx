"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  patchWorkspaceSession,
  readWorkspaceSession,
  type UserProfileOnboarding,
} from "@/lib/session/workspace-session";
import { DEPARTMENT_SUGGESTIONS } from "@/lib/onboarding-profile-options";

export function ProfileOnboardingWizard() {
  const router = useRouter();
  const initial = useMemo(() => readWorkspaceSession().profileDraft, []);

  const [jobTitle, setJobTitle] = useState(initial.jobTitle);
  const [department, setDepartment] = useState(initial.department);
  const [errors, setErrors] = useState<{ jobTitle: string | null; department: string | null }>(
    { jobTitle: null, department: null },
  );

  const saveProfile = () => {
    const nextErrors = { jobTitle: null as string | null, department: null as string | null };
    if (!jobTitle.trim()) nextErrors.jobTitle = "Укажите должность.";
    if (!department.trim()) nextErrors.department = "Укажите отдел.";
    if (nextErrors.jobTitle || nextErrors.department) {
      setErrors(nextErrors);
      return;
    }
    const profile: UserProfileOnboarding = {
      jobTitle: jobTitle.trim(),
      department: department.trim(),
    };
    patchWorkspaceSession({
      profile,
      profileDraft: {
        jobTitle: profile.jobTitle,
        department: profile.department,
      },
      aiGuideCompleted: true,
    });
    router.push("/chat");
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-lg">Профиль</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="job-title">Должность</Label>
          <Input
            id="job-title"
            value={jobTitle}
            onChange={(e) => {
              setJobTitle(e.target.value);
              setErrors((prev) => ({ ...prev, jobTitle: null }));
            }}
            placeholder="Например, Product Manager"
          />
          {errors.jobTitle ? (
            <p className="text-sm text-destructive" role="alert">
              {errors.jobTitle}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="department">Отдел</Label>
          <Input
            id="department"
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              setErrors((prev) => ({ ...prev, department: null }));
            }}
            list="department-suggestions"
            placeholder="Например, Product"
          />
          <datalist id="department-suggestions">
            {DEPARTMENT_SUGGESTIONS.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
          {errors.department ? (
            <p className="text-sm text-destructive" role="alert">
              {errors.department}
            </p>
          ) : null}
        </div>
      </CardContent>
      <CardFooter className="border-t">
        <Button type="button" onClick={saveProfile} className="w-full">
          Сохранить и перейти в чат
        </Button>
      </CardFooter>
    </Card>
  );
}
