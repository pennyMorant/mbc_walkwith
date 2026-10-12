export type SelectAllValue<T extends string | undefined> =
  | Exclude<T, undefined>
  | "";

export type QueryWithSelectAll<
  TQuery,
  TKey extends keyof TQuery
> = Partial<Omit<TQuery, TKey>> & {
  [Key in TKey]?: SelectAllValue<Extract<TQuery[Key], string | undefined>>;
};

export type QueryWithNullableString<
  TQuery,
  TKey extends keyof TQuery
> = Partial<Omit<TQuery, TKey>> & {
  [Key in TKey]?: Extract<TQuery[Key], string | undefined> | null;
};
