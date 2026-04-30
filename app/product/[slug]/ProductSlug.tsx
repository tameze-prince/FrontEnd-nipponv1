import ProductDetailExperience from '@/components/shared/ProductDetailExperience';

type RawSearchParams = Record<string, string | string[] | undefined>;

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<RawSearchParams>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const initialVariantId = getSingleValue(query.variant);

  return <ProductDetailExperience slug={slug} initialVariantId={initialVariantId} />;
}
