import assert from "assert";
import DATABASE from "./database.json";

export function proxy(pathname) {
  if (pathname.startsWith("/std")) {
    console.log("proxy", pathname);
    return proxy("/x" + pathname);
  }
  if (!pathname.startsWith("/x/")) {
    return null;
  }

  const nameBranchRest = pathname.replace(/^\/x\//, "");
  console.log("nameBranchRest", nameBranchRest);
  const [nameBranch, ...rest] = nameBranchRest.split("/");
  const [name, branch] = nameBranch.split("@", 2);

  const path = rest.join("/");

  console.log("getEntry", { name, branch, path });
  const entry = getEntry(name, branch);

  if (!entry || !entry.url) {
    return null;
  }

  assert(!path.startsWith("/"));
  return { entry, path };
}

/**
 * Pull an entry from the database
 * @param  {string} name
 * @param  {string}                branch
 * @return {import('./types').Entry}
 */
export function getEntry(name, branch = "master") {
  // denoland/deno_std was merged into denoland/deno. For a while we will try
  // to maintain old links for backwards compatibility with denoland/deno_std
  // but eventually tags before v0.20.0 will break.
  if (
    name === "std" &&
    (branch === "v0.16.0" ||
      branch === "v0.17.0" ||
      branch === "v0.18.0" ||
      branch === "v0.19.0" ||
      branch === "v0.20.0" ||
      branch.startsWith("8c90bd") ||
      branch.startsWith("17a214") ||
      branch.startsWith("6958a4"))
  ) {
    name = "std_old";
  }

  const rawEntry = DATABASE[name];
  if (!rawEntry) {
    return null;
  } else if (rawEntry.type === "url") {
    return {
      name,
      branch,
      raw: rawEntry,
      type: "url",
      url: path => rawEntry.url.replace(/\$\{b}/, branch) + path,
      repo: path => rawEntry.repo.replace(/\$\{b}/, branch) + path
    };
  }
  if (rawEntry.type === "esm") {
    const version = branch === "master" ? "latest" : branch;
    return {
      name,
      raw: rawEntry,
      type: "esm",
      url: path => rawEntry.url.replace(/\$\{v}/, version) + path,
      repo: path => rawEntry.repo.replace(/\$\{v}/, version) + path
    };
  }
  if (rawEntry.type === "github") {
    return {
      name,
      branch,
      raw: rawEntry,
      type: "github",
      url: path =>
        `https://raw.githubusercontent.com/${rawEntry.owner}/${
          rawEntry.repo
        }/${branch}${rawEntry.path || "/"}${path}`,
      repo: path =>
        `https://github.com/${rawEntry.owner}/${
          rawEntry.repo
        }/tree/${branch}${rawEntry.path || "/"}${path}`
    };
  }
  if (rawEntry.type === "gitlab") {
    return {
      name,
      branch,
      raw: rawEntry,
      type: "gitlab",
      url: path => {
        return `https://gitlab.com/api/v4/projects/${encodeURIComponent(
          rawEntry.project
        )}/repository/files/${encodeURIComponent(
          (rawEntry.path || "") + path
        )}/raw?ref=${branch}`;
      },
      repo: path =>
        `https://gitlab.com/${rawEntry.project}/blob/${branch}${rawEntry.path ||
          "/"}${path}`
    };
  }
  return null;
}
