export function create(name: string) {
  let id = `virtual:react-router/${name}`;
  return {
    id,
    resolvedId: `\0${id}`,
    url: `/@id/__x00__${id}`,
  };
}
