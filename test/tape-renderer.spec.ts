import TapeRenderer from '../src/tape-renderer';
import { createTapeFromJSON, SerializedTape } from '../src/tape';

const serializedTape: SerializedTape = {
  meta: {
    endpoint: 'proxy.test.com',
    createdAt: new Date(),
  },
  request: {
    url: '/foo/bar/1?real=3',
    method: 'GET',
    headers: {
      accept: ['text/unknown'],
      'content-type': ['text/plain'],
      'x-ignored': ['1'],
    },
    body: 'ABC',
  },
  response: {
    status: 200,
    headers: {
      'content-type': ['text/unknown'],
      'x-ignored': ['2'],
    },
    body: Buffer.from('Hello').toString('base64'),
  },
};

const tape = createTapeFromJSON(serializedTape);

describe('TapeRenderer', () => {
  describe('.fromStore', () => {
    it('creates a tape from the raw file data with req and res human readable', () => {
      expect(tape.request.url).toEqual('/foo/bar/1?real=3');
      expect(tape.request.headers['accept'][0]).toEqual('text/unknown');
      expect(tape.request.headers['x-ignored'][0]).toBe('1');
      expect(tape.request.body).toEqual(Buffer.from('ABC'));

      expect(tape.response.headers['content-type']).toEqual(['text/unknown']);
      expect(tape.response.headers['x-ignored']).toEqual(['2']);
      expect(tape.response.body).toEqual(Buffer.from(Buffer.from('Hello').toString('base64')));
    });

    it('creates a tape from the raw file data with req and res not human readable', () => {
      const newRaw: SerializedTape = {
        ...serializedTape,
        meta: {
          ...serializedTape.meta,
        },
        request: {
          ...serializedTape.request,
          body: 'SGVsbG8=',
        },
        response: {
          ...serializedTape.response,
          body: 'ABC',
        },
      };

      const tape = createTapeFromJSON(newRaw);

      expect(tape.request.url).toEqual('/foo/bar/1?real=3');
      expect(tape.request.headers['accept']).toEqual(['text/unknown']);
      expect(tape.request.headers['x-ignored']).toEqual(['1']);
      expect(tape.request.body).toEqual(Buffer.from('SGVsbG8='));

      expect(tape.response.headers['content-type']).toEqual(['text/unknown']);
      expect(tape.response.headers['x-ignored']).toEqual(['2']);
      expect(tape.response.body).toEqual(Buffer.from('ABC'));
    });

    it('can read pretty JSON', () => {
      const newRaw: SerializedTape = {
        ...serializedTape,
        meta: {
          ...serializedTape.meta,
        },
        request: {
          ...serializedTape.request,
          headers: {
            ...serializedTape.request.headers,
            'content-type': ['application/json'],
            'content-length': ['20'],
          },
          body: JSON.stringify({
            param: 'value',
            nested: {
              param2: 3,
            },
          }),
        },
        response: {
          ...serializedTape.response,
          headers: {
            ...serializedTape.response.headers,
            'content-type': ['application/json'],
            'content-length': ['20'],
          },
          body: JSON.stringify({
            foo: 'bar',
            utf8: '🔤',
            nested: {
              fuu: 3,
            },
          }),
        },
      };

      let tape = createTapeFromJSON(newRaw);

      expect(tape.request.body).toEqual(Buffer.from(newRaw.request.body));

      expect(tape.response.body).toEqual(Buffer.from(newRaw.response.body));
      expect(tape.response.headers['content-length']).toEqual(['20']);

      delete newRaw.response.headers['content-length'];
      tape = createTapeFromJSON(newRaw);
      expect(tape.response.headers['content-length']).toEqual(undefined);
    });
  });

  describe('#render', () => {
    it('renders a tape', () => {
      const rawDup: SerializedTape = {
        ...serializedTape,
        request: {
          ...serializedTape.request,
          headers: {
            ...serializedTape.request.headers,
          },
        },
      };

      expect(new TapeRenderer(tape).render()).toEqual(rawDup);
    });

    it('renders json response as an object', () => {
      const newRaw: SerializedTape = {
        ...serializedTape,
        meta: {
          ...serializedTape.meta,
        },
        request: {
          ...serializedTape.request,
          headers: {
            ...serializedTape.request.headers,
          },
        },
        response: {
          ...serializedTape.response,
          headers: {
            ...serializedTape.response.headers,
            'content-type': ['application/json'],
            'content-length': ['20'],
          },
          body: JSON.stringify({
            foo: 'bar',
            nested: {
              fuu: 3,
            },
          }),
        },
      };
      const newTape = createTapeFromJSON(newRaw);

      expect(new TapeRenderer(newTape).render()).toEqual(newRaw);
    });

    it('renders tapes with empty bodies', () => {
      const newRaw: SerializedTape = {
        ...serializedTape,
        request: {
          ...serializedTape.request,
          body: '',
          method: 'HEAD',
          headers: {
            ...serializedTape.request.headers,
            'content-type': ['application/json'],
          },
        },
        response: {
          ...serializedTape.response,
          headers: {
            ...serializedTape.response.headers,
            'content-type': ['application/json'],
          },
          body: '',
        },
      };
      const newTape = createTapeFromJSON(newRaw);

      expect(new TapeRenderer(newTape).render()).toEqual(newRaw);
    });
  });
});