type Maybe<T> = T | undefined;
type EnumNames<Enums> = ExtractKeys<Enums, EnumItem>
type KeyCodeName = CastsToEnum<Enum.KeyCode>;
type MutuallyExclusive<T, K1 extends keyof T, K2 extends keyof T> = (T & { [K in K1]?: never } & { [K in K2]-?: T[K2] }) | (T & { [K in K1]-?: T[K1] } & { [K in K2]?: never });

type DeepReadonly<T> =
  T extends (infer R)[] ? DeepReadonlyArray<R> :
  T extends Callback ? T :
  T extends object ? DeepReadonlyObject<T> :
  T;

interface DeepReadonlyArray<T> extends ReadonlyArray<DeepReadonly<T>> { }

type DeepReadonlyObject<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
};

type DeepWritable<T> =
  T extends (infer R)[] ? DeepWritableArray<R> :
  T extends Callback ? T :
  T extends object ? DeepWritableObject<T> :
  T;

interface DeepWritableArray<T> extends Array<DeepWritable<T>> { }

type DeepWritableObject<T> = {
  -readonly [P in keyof T]: DeepWritable<T[P]>;
};

type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
  ? DeepPartial<U>[]
  : T[P] extends object
  ? DeepPartial<T[P]>
  : T[P];
};