import path from "node:path";

export default {
  "client/**/*.{ts,tsx,js,jsx}": (filenames) => {
    const filePaths = filenames.map((f) => `"${path.resolve(f)}"`).join(" ");
    return [
      `pnpm --dir client exec eslint --fix ${filePaths}`,
      `pnpm --dir client exec tsc --noEmit`,
    ];
  },
  "BFF/**/*.{cs,csproj,slnx}": () => [
    "dotnet build BFF/LmsSaaS.slnx",
    "dotnet test BFF/LmsSaaS.slnx",
  ],
};
