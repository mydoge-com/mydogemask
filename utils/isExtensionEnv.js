export const isExtensionEnv = () => {
  return (
    // eslint-disable-next-line no-undef
    typeof window !== 'undefined' && typeof chrome?.storage !== 'undefined'
  );
};
