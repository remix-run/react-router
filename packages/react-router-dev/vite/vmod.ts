export let id = (name: string) => `virtual:react-router/${name}`;
export let resolve = (id: string) => `\0${id}`;
export let url = (id: string) => `/@id/__x00__${id}`;
