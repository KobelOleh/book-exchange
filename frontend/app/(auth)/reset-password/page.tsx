import { Suspense } from 'react';
import { ResetPasswordForm } from '@/components/password-reset-form';

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
