import { batchProcessQueue, chunkArray, StatusExecution, removeCallback, IManyQueryResponse } from '../src/handler';
import { getDefaultInstance, getModelMetadata, model, Schema } from '../src';
import { ModelMetadata } from '../src/model/interfaces/model-metadata.interface';
import { delay, startInTest } from './testData';
import couchbase from 'couchbase';

describe('Test Document Remove Many', () => {
  test('Test Process Query Stack Function', async () => {
    const removeCallback = async (id: string) => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (id.indexOf('9') !== -1) {
        return Promise.resolve(new StatusExecution(id, 'SUCCESS'));
      } else {
        return Promise.reject(new StatusExecution(id, 'FAILURE'));
      }
    };
    const stack = Array(205)
      .fill(null)
      .map((u, i) => i.toString());
    // @ts-ignore
    const items = await batchProcessQueue({ collection: null } as ModelMetadata)(stack, removeCallback, 100);
    expect(items.message.success).toBe(38);
    expect(items.message.errors.length).toBe(167);
  });
  test('Test ChunkArray Function', () => {
    const stack = Array(50)
      .fill(null)
      .map((u, i) => i.toString());
    const result = chunkArray(stack, 10);
    expect(result.length).toBe(5);
  });

  test('Test Remove Many Function', async () => {
    const CatSchema = new Schema({
      name: String,
      age: Number,
    });
    const Cat = model('Cat', CatSchema);
    startInTest(getDefaultInstance());

    const batchCreate = async () => {
      await Cat.create({ name: 'Cat0', age: 27 });
      await Cat.create({ name: 'Cat1', age: 28 });
      await Cat.create({ name: 'Cat2', age: 29 });
      await Cat.create({ name: 'Cat3', age: 30 });
    };
    await batchCreate();
    await delay(500);
    const response: IManyQueryResponse = await Cat.removeMany({ name: { $like: '%Cat%' } });
    expect(response.message.success).toBe(4);
    expect(response.message.match_number).toBe(4);
  });

  test('Test Remove Many Function Document Not Found Error', async () => {
    const CatSchema = new Schema({
      name: String,
      age: Number,
    });
    const Cat = model('Cat', CatSchema);
    startInTest(getDefaultInstance());
    const response: IManyQueryResponse = await Cat.removeMany({ name: { $like: 'DummyCatName91' } });
    expect(response.message.success).toBe(0);
    expect(response.message.match_number).toBe(0);
    expect(response.message.errors).toEqual([]);
  });

  test('Update Many Response Errors', async () => {
    const CatSchema = new Schema({
      name: String,
      age: Number,
    });
    const Cat = model('Cat', CatSchema);
    const metadata = getModelMetadata(Cat);
    try {
      await removeCallback('dummy_id', metadata);
    } catch (error) {
      const dnf = new (couchbase as any).DocumentNotFoundError();
      expect(error.exception).toBe(dnf.constructor.name);
      expect(error.message).toBe(dnf.message);
      expect(error.status).toBe('FAILURE');
      const cleanUp = async () => await Cat.removeMany({ _type: 'Cat' });
      await cleanUp();
    }
  });
});
