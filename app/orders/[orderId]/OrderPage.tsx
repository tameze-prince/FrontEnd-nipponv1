import { notFound } from 'next/navigation';

import OrderConfirmationExperience from '@/components/shared/OrderConfirmationExperience';
import { Badge } from '@/components/ui/badge';

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  if (!orderId) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fff3e8,transparent_35%),linear-gradient(180deg,#fffdfb_0%,#fff8f2_45%,#ffffff_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="space-y-4">
          <Badge className="rounded-full bg-orange-100 px-4 py-1 text-orange-700 hover:bg-orange-100">
            Confirmation NipponHub
          </Badge>
          <div className="space-y-3">
            <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Commande placee, recapitulatif pret, suite du flow bien ancree.
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              On termine maintenant le tunnel client avec une vraie page de confirmation. Ensuite,
              le meilleur prochain bloc sera le dashboard/admin ou bien le branchement API.
            </p>
          </div>
        </section>

        <OrderConfirmationExperience orderId={orderId} />
      </div>
    </main>
  );
}
