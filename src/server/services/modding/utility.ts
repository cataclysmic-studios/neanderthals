import { HttpService } from "@rbxts/services";

import type { Mod, ModRepo } from "shared/structs/mod";

const BASE_URL = "https://raw.githubusercontent.com/"

export async function getRawContents(repo: ModRepo, branch: string, path: string): Promise<string>;
export async function getRawContents(mod: Mod, path: string): Promise<string>;
export async function getRawContents(a: ModRepo | Mod, b: string, c?: string): Promise<string> {
  const repo = typeIs(a, "string") ? a : a.repo;
  const branch = typeIs(a, "string") ? b : a.branch;
  const path = typeIs(c, "string") ? c : b;

  return new Promise((resolve, reject) => {
    try {
      const url = BASE_URL + repo + "/refs/heads/" + branch + "/" + path;
      const content = HttpService.GetAsync(url, true);
      resolve(content);
    } catch (e) {
      reject(e);
    }
  });
}