import { redirect } from 'next/navigation';

export default function AutoRedirectToLoginPage() {
  // Perform server-side redirect to the login page.
  redirect('/login');

  // This return is technically unreachable due to redirect,
  // but good practice for non-void function.
  return null;
}
