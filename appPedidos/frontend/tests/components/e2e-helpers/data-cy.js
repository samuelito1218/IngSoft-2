export const dataCy = (value) => {
  if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
    return { 'data-cy': value };
  }
  return {};
};
