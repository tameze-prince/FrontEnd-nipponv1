import { promotionService } from '@/lib/promotion-service';

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

describe('promotionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('charge les flash sales depuis /api/v1/flash-sales', async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      createJsonResponse([
        {
          id: 9,
          product: { id: 1, name: 'Produit test' },
          discountPct: 25,
          startsAt: '2026-05-01T10:00:00',
          endsAt: '2026-05-02T10:00:00',
          active: true,
        },
      ])
    );

    const response = await promotionService.getFlashSales();

    expect(response.success).toBe(true);
    expect(response.data?.[0]).toEqual(
      expect.objectContaining({
        id: '9',
        productId: '1',
        productName: 'Produit test',
        discountPct: 25,
      })
    );
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/flash-sales',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('cree une flash sale avec le payload backend attendu', async () => {
    (global.fetch as jest.Mock).mockImplementation(async (_url: string, init?: RequestInit) => {
      const payload = JSON.parse(String(init?.body));

      expect(payload).toEqual({
        productId: 12,
        discountPct: 30,
        startsAt: '2026-05-01T09:00',
        endsAt: '2026-05-01T18:00',
      });

      return createJsonResponse({
        id: 11,
        product: { id: 12, name: 'Casque' },
        discountPct: 30,
        startsAt: '2026-05-01T09:00',
        endsAt: '2026-05-01T18:00',
        active: true,
      }, 201);
    });

    const response = await promotionService.createFlashSale({
      productId: '12',
      discountPct: 30,
      startsAt: '2026-05-01T09:00',
      endsAt: '2026-05-01T18:00',
    });

    expect(response.success).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/flash-sales',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('met a jour une flash sale existante', async () => {
    (global.fetch as jest.Mock).mockImplementation(async (_url: string, init?: RequestInit) => {
      const payload = JSON.parse(String(init?.body));

      expect(payload).toEqual({
        productId: 12,
        discountPct: 35,
        startsAt: '2026-05-03T09:00',
        endsAt: '2026-05-03T21:00',
      });

      return createJsonResponse({
        id: 11,
        product: { id: 12, name: 'Casque' },
        discountPct: 35,
        startsAt: '2026-05-03T09:00',
        endsAt: '2026-05-03T21:00',
        active: true,
      });
    });

    const response = await promotionService.updateFlashSale('11', {
      productId: '12',
      discountPct: 35,
      startsAt: '2026-05-03T09:00',
      endsAt: '2026-05-03T21:00',
    });

    expect(response.success).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8080/api/v1/flash-sales/11',
      expect.objectContaining({ method: 'PUT' })
    );
  });
});
