const containers: Map<object, string[]> = new Map<object, string[]>();

export function getProperties(name: object): string[] {
  return containers.get(name) || [];
}

export function Prop(query: string = '') {
  return (target: any, propertyKey: string) => {
    const properties: string[] = getProperties(target.constructor);
    const propertyPosition: number = properties.indexOf(propertyKey);

    if (propertyPosition !== -1 && query) {
      properties.splice(propertyPosition, 1, query);
    } else {
      properties.push(query || propertyKey);
    }

    containers.set(target.constructor, properties);
  };
}
