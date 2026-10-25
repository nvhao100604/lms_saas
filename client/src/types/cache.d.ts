import "next/cache";

declare module "next/cache" {
  export interface CacheLifeProfiles {
    frequent: true;
    dashboard: true;
    courses: true;
    static: true;
  }
}
