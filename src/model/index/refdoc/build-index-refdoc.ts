import { indexFieldsName } from '../helpers/index-field-names';
import { ModelMetadata } from '../../interfaces/model-metadata';

export const buildViewRefdoc = (metadata: ModelMetadata, Model, fields, prefix) => async (...values: any[]) => {
  const key = buildRefKey(fields, values, prefix);
  const { collection } = metadata;
  const result = await collection.get(key);
  if (result && result.value) {
    return Model.findById(result.value);
  }
};

export const buildFieldsRefKey = (fields: string[], prefix: string): string => {
  const fieldsKey: string = indexFieldsName(fields);
  return `${prefix}$${fieldsKey}`;
};

export const buildRefKey = (fields: string[], values: string[], prefix: string): string => {
  const fieldsRefKey: string = buildFieldsRefKey(fields, prefix);
  const valuesKey: string = values.join('|');
  return `$${fieldsRefKey}.${valuesKey}`;
};
