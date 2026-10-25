const repository = process.env.GITHUB_REPOSITORY;
if (!repository || !/^[\w.-]+\/[\w.-]+$/.test(repository)) throw new Error("GITHUB_REPOSITORY가 필요합니다.");
const [owner, name] = repository.split("/");
const base = name.toLowerCase() === `${owner.toLowerCase()}.github.io` ? "" : `/${name}`;
console.log(`base_path=${base}`);
