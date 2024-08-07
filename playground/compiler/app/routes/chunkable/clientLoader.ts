export const clientLoader = async () => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return "hello from chunkable client loader!";
};
