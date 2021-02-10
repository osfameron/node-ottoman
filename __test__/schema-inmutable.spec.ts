import { getDefaultInstance, IManyQueryResponse, model, Schema } from '../src';
import { delay, startInTest } from './testData';

describe('Test Schema Immutable', () => {
  const CardSchemaBase = new Schema({
    cardNumber: { type: String, immutable: true },
    zipCode: String,
  });
  const cardInfo = {
    cardNumber: '5252 5252 5252 5252',
    zipCode: '52525',
  };
  const cardInfoUpdate = {
    cardNumber: '4242 4242 4242 4242',
    zipCode: '42424',
  };

  test("Test Schema Immutable integration on strict=false'", async () => {
    const CardSchema = new Schema(CardSchemaBase, { strict: false });
    const Card = model('Card', CardSchema);
    await startInTest(getDefaultInstance());
    const result = await Card.create(cardInfo);
    result.cardNumber = '80';
    expect(result.cardNumber).toBe('80');
  });

  test("Test Schema Immutable integration on strict='throw'", async () => {
    const CardSchema = new Schema(CardSchemaBase, { strict: 'throw' });
    const Card = model('Card', CardSchema);
    await startInTest(getDefaultInstance());
    const result = await Card.create(cardInfo);
    try {
      result.cardNumber = '80';
    } catch (e) {
      expect((e as Error).message).toBe("Field 'cardNumber' is immutable and strict = 'throw'");
    }
  });
  test('Test Schema Immutable integration on strict=true', async () => {
    const Card = model('Card', CardSchemaBase);
    await startInTest(getDefaultInstance());
    const result = await Card.create(cardInfo);
    result.cardNumber = '80';
    expect(result.cardNumber).toBe(cardInfo.cardNumber);
  });
  test('Test Schema Immutable integration -> findOne', async () => {
    const Card = model('Card', CardSchemaBase);
    await startInTest(getDefaultInstance());
    await Card.create(cardInfo);
    const result = await Card.findOne({ cardNumber: '5252 5252 5252 5252' });
    result.cardNumber = '80';
    expect(result.cardNumber).toBe(cardInfo.cardNumber);
  });
  test('Test Schema Immutable integration -> findById', async () => {
    const Card = model('Card', CardSchemaBase);
    await startInTest(getDefaultInstance());
    const { id } = await Card.create(cardInfo);
    const result = await Card.findById(id);
    result.cardNumber = '80';
    expect(result.cardNumber).toBe(cardInfo.cardNumber);
  });
  test('Test Schema Immutable integration -> Update a document', async () => {
    const Card = model('Card', CardSchemaBase);
    await startInTest(getDefaultInstance());
    const { id } = await Card.create(cardInfo);
    await Card.updateById(id, cardInfoUpdate);
    const card = await Card.findById(id);
    expect(card.cardNumber).toBe('5252 5252 5252 5252');
    expect(card.zipCode).toBe('42424');
  });
  test('Test Schema Immutable integration -> Replace a document', async () => {
    const Card = model('Card', CardSchemaBase);
    await startInTest(getDefaultInstance());
    const { id } = await Card.create(cardInfo);
    await Card.replaceById(id, cardInfoUpdate);
    const card = await Card.findById(id);
    expect(card.cardNumber).toBe('5252 5252 5252 5252');
    expect(card.zipCode).toBe('42424');
  });
  test('Test Schema Immutable integration -> findOneAndUpdate', async () => {
    const Card = model('Card', CardSchemaBase);
    await startInTest(getDefaultInstance());
    await Card.create(cardInfo);
    const card = await Card.findOneAndUpdate({ cardNumber: { $like: '%5252%' } }, cardInfoUpdate, { new: false });
    expect(card.cardNumber).toBe('5252 5252 5252 5252');
    expect(card.zipCode).toBe('42424');
  });
  test('Test Schema Immutable integration -> updateMany', async () => {
    const CardSchema = new Schema({
      cardNumber: String,
      zipCode: { type: String, immutable: true },
    });
    const Card = model('CardMany', CardSchema);
    await startInTest(getDefaultInstance());

    let card1;
    let card2;

    const batchCreate = async () => {
      card1 = await Card.create({ cardNumber: '1111 1111 1111 1111', zipCode: '11111' });
      card2 = await Card.create({ cardNumber: '1111 2222 2222 2222', zipCode: '22222' });
    };
    await batchCreate();
    await delay(500);
    const response: IManyQueryResponse = await Card.updateMany(
      { cardNumber: { $like: '%1111%' } },
      { zipCode: '12345' },
    );
    const result1 = await Card.findById(card1.id);
    const result2 = await Card.findById(card2.id);

    await delay(500);
    const cleanUp = async () => await Card.removeMany({ _type: 'CardMany' });
    await cleanUp();
    expect(response.message.success).toBe(2);
    expect(response.message.match_number).toBe(2);
    expect(result1.zipCode).toBe('11111');
    expect(result2.zipCode).toBe('22222');
  });
});
