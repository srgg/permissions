export function getEnumValues<T>(Type: T): any[] {
  return Object.keys(Type)
    .map(k => Type[k as any])
    .map(v => v as T);
}

export function enumKeyOf<T, V>(Type: T, value: V): any {
  return Object.keys(Type).find(k => Type[k as any] === value);
}

export function isValidEnumValue<T, V>(Type: T, value: V): boolean {
  return value && getEnumValues(Type).some(enumValue => enumValue === value);
}
