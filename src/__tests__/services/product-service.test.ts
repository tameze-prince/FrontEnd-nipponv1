import { productService } from '@/lib/product-service';

function createJsonResponse(data: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: () => 'application/json',
    },
    json: async () => data,
    text: async () => JSON.stringify(data),
  } as Response);
}

describe('productService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('envoie le filtre countryId vers le catalogue', async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      createJsonResponse({
        content: [],
        totalElements: 0,
        totalPages: 0,
        number: 0,
        size: 12,
      })
    );

    await productService.getProducts({ page: 1, pageSize: 12, countryId: '7' });

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/products?countryId=7&page=0&size=12',
      expect.objectContaining({
        method: 'GET',
      })
    );
  });

  it('cree un produit avec stockCountryId et variantes dans le FormData', async () => {
    (global.fetch as jest.Mock).mockImplementation(async (_url: string, init?: RequestInit) => {
      const body = init?.body as FormData;
      const payloadBlob = body.get('data') as Blob;
      const payload = JSON.parse(await payloadBlob.text());

      expect(payload.stockCountryId).toBe(3);
      expect(payload.initialStock).toBe(12);
      expect(payload.variants).toEqual([
        {
          label: 'Noir / XL',
          extraPrice: 1500,
          imageUrl: '',
        },
      ]);

      return createJsonResponse({
        id: 10,
        name: 'Figurine',
        slug: 'figurine',
        basePrice: 10000,
        categoryName: 'Anime',
        franchiseName: 'Naruto',
        variants: [
          {
            id: 1,
            label: 'Noir / XL',
            extraPrice: 1500,
            finalPrice: 11500,
            stockQuantity: 12,
          },
        ],
        imageUrls: [],
        active: true,
      });
    });

    const response = await productService.createProduct({
      name: 'Figurine',
      description: 'Test',
      price: 10000,
      categoryId: '2',
      stock: 12,
      stockCountryId: '3',
      variants: [{ color: 'Noir', size: 'XL', sku: 'SKU-1', price: 11500 }],
      images: [],
    });

    expect(response.success).toBe(true);
    expect(response.data?.variants[0].label).toBe('Noir / XL');
  });

  it('ajoute plusieurs variantes sur le bon endpoint', async () => {
    (global.fetch as jest.Mock).mockImplementation((_url: string) =>
      createJsonResponse({
        id: 5,
        label: 'Rouge / M',
        extraPrice: 500,
        finalPrice: 10500,
        stockQuantity: 0,
      })
    );

    const response = await productService.addVariants('42', [
      { label: 'Rouge / M', extraPrice: 500 },
      { label: 'Bleu / L', extraPrice: 1000 },
    ]);

    expect(response.success).toBe(true);
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      'http://localhost:8080/api/v1/products/42/variants',
      expect.objectContaining({
        method: 'POST',
      })
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      'http://localhost:8080/api/v1/products/42/variants',
      expect.objectContaining({
        method: 'POST',
      })
    );
  });
});
