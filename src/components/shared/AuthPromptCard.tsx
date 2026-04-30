'use client';

import Link from 'next/link';
import { LockKeyhole, ShoppingBag } from 'lucide-react';

import { buildAuthRedirectHref } from '@/lib/auth-redirect';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface AuthPromptCardProps {
  title: string;
  description: string;
  redirectTo: string;
}

export default function AuthPromptCard({
  title,
  description,
  redirectTo,
}: AuthPromptCardProps) {
  return (
    <Card className="rounded-[2rem] border-0 bg-white shadow-xl shadow-orange-100/40">
      <CardContent className="space-y-6 py-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-orange-600">
          <LockKeyhole className="h-7 w-7" />
        </div>

        <div className="space-y-3">
          <h2 className="text-3xl font-black text-slate-950">{title}</h2>
          <p className="mx-auto max-w-2xl text-sm leading-7 text-slate-500">{description}</p>
        </div>

        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button
            asChild
            className="h-12 rounded-full bg-[linear-gradient(135deg,#ff8c42,#ff9f5a)] text-white hover:opacity-95"
          >
            <Link href={buildAuthRedirectHref('/auth/login', redirectTo)}>
              <LockKeyhole className="mr-2 h-4 w-4" />
              Se connecter
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-12 rounded-full border-orange-200">
            <Link href={buildAuthRedirectHref('/auth/register', redirectTo)}>
              <ShoppingBag className="mr-2 h-4 w-4" />
              Creer un compte
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
