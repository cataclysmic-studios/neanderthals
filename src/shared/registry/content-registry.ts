import { Registry } from "./registry";

export abstract class ContentRegistry extends Registry {
  protected readonly content = new Map<string, Model>;
  protected readonly byName = new Map<string, string>;

  public getAll(): Model[] {
    return [...this.content].map(([_, content]) => content);
  }

  public register(content: Model): void {
    const id = content.GetAttribute<string>("ID")!;
    this.content.set(id, content);
    this.byName.set(content.Name, id);
  }

  public get<T extends Model = Model>(id: string): T {
    return this.content.get(id) as T;
  }

  public getByName(name: string): Model {
    return this.get(this.byName.get(name)!);
  }
}