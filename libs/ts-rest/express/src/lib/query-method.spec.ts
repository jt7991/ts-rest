/** @jest-environment node */

import { once } from 'node:events';
import { METHODS } from 'node:http';
import type { AddressInfo } from 'node:net';
import * as express from 'express';
import { initClient, initContract } from '@ts-rest/core';
import { z } from 'zod';
import { createExpressEndpoints, initServer } from './ts-rest-express';

const itWithQuery = METHODS.includes('QUERY') ? it : it.skip;

itWithQuery('sends and validates an HTTP QUERY body', async () => {
  const c = initContract();
  const contract = c.router({
    search: c.query({
      method: 'QUERY',
      path: '/search',
      body: z.object({
        filter: z
          .string()
          .min(1)
          .transform((filter) => filter.toUpperCase()),
      }),
      responses: { 200: z.object({ filter: z.string() }) },
    }),
  });
  const app = express();
  app.use(express.json());
  createExpressEndpoints(
    contract,
    initServer().router(contract, {
      search: async ({ body }) => ({
        status: 200,
        body: { filter: body.filter },
      }),
    }),
    app,
    { logInitialization: false },
  );

  const server = app.listen(0, '127.0.0.1');
  try {
    await once(server, 'listening');
    const baseUrl = `http://127.0.0.1:${
      (server.address() as AddressInfo).port
    }`;
    const client = initClient(contract, { baseUrl });

    const result = await client.search({ body: { filter: 'active' } });
    expect(result).toMatchObject({ status: 200, body: { filter: 'ACTIVE' } });

    const invalid = await client.search({ body: { filter: '' } });
    expect(invalid.status).toBe(400);
    expect((await fetch(`${baseUrl}/search`)).status).toBe(404);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
