import { Badge } from '@/components/ui/badge';
import ProductCatalog, {
  type ProductCatalogInitialState,
} from '@/components/shared/ProductCatalog';

type RawSearchParams = Record<string, string | string[] | undefined>;

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

function getListValue(value: string | string[] | undefined) {
  const raw = getSingleValue(value);
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const params = await searchParams;

  const initialState: ProductCatalogInitialState = {
    search: getSingleValue(params.search),
    minPrice: getSingleValue(params.minPrice),
    maxPrice: getSingleValue(params.maxPrice),
    sort: (getSingleValue(params.sort) || 'popularity') as ProductCatalogInitialState['sort'],
    categories: getListValue(params.categories),
    colors: getListValue(params.colors),
    inStock: getSingleValue(params.inStock) === 'true',
    flashSale: getSingleValue(params.flashSale) === 'true',
    page: Math.max(1, Number(getSingleValue(params.page) || '1') || 1),
  };

  const catalogKey = JSON.stringify(initialState);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#fff3e8,transparent_35%),linear-gradient(180deg,#fffdfb_0%,#fff8f2_50%,#ffffff_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="space-y-4">
          <Badge className="rounded-full bg-orange-100 px-4 py-1 text-orange-700 hover:bg-orange-100">
            Catalogue NipponHub
          </Badge>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <h1 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Produits filtres, URL partageable, base prete pour l&apos;API.
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                Cette page couvre la phase catalogue du prompt: filtres, tri, pagination,
                compatibilite multi-localisation et etat lisible dans l&apos;URL.
              </p>
            </div>
          </div>
        </section>

        <ProductCatalog key={catalogKey} initialState={initialState} />
      </div>
    </main>
  );
}
