import { Badge } from '@/components/ui/badge';
import CartExperience from '@/components/shared/CartExperience';

export default function CartPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fff3e8,transparent_35%),linear-gradient(180deg,#fffdfb_0%,#fff8f2_45%,#ffffff_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="space-y-4">
          <Badge className="rounded-full bg-orange-100 px-4 py-1 text-orange-700 hover:bg-orange-100">
            Panier NipponHub
          </Badge>
          <div className="space-y-3">
            <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Panier persistant, resume clair, base checkout ready.
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              Cette page couvre la gestion des articles, des quantites, du total et du resume de
              commande. C&apos;est la bonne fondation pour brancher le futur checkout multi-etapes.
            </p>
          </div>
        </section>

        <CartExperience />
      </div>
    </main>
  );
}
