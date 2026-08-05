// deno-lint-ignore-file
/* eslint-disable */
// biome-ignore: needed import
import type { OneRouter } from 'one'

declare module 'one' {
  export namespace OneRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes:
        | `/`
        | `/_sitemap`
        | `/artists`
        | `/contact`
        | `/enquiry`
        | `/exhibitions`
        | `/login`
        | `/register`
        | `/studio`
        | `/studio/admin`
        | `/studio/admin/artists`
        | `/studio/admin/artworks`
        | `/studio/admin/customers`
        | `/studio/admin/enquiries`
        | `/studio/profile`
        | `/studio/works`
        | `/studio/works/new`
        | `/works`
      DynamicRoutes:
        | `/artists/${OneRouter.SingleRoutePart<T>}`
        | `/exhibitions/${OneRouter.SingleRoutePart<T>}`
        | `/studio/works/${OneRouter.SingleRoutePart<T>}`
        | `/works/${OneRouter.SingleRoutePart<T>}`
      DynamicRouteTemplate:
        | `/artists/[slug]`
        | `/exhibitions/[slug]`
        | `/studio/works/[id]`
        | `/works/[slug]`
      IsTyped: true
      RouteTypes: {
        '/artists/[slug]': RouteInfo<{ slug: string }>
        '/exhibitions/[slug]': RouteInfo<{ slug: string }>
        '/studio/works/[id]': RouteInfo<{ id: string }>
        '/works/[slug]': RouteInfo<{ slug: string }>
      }
    }
  }
}

/**
 * Helper type for route information
 */
type RouteInfo<Params = Record<string, never>> = {
  Params: Params
  LoaderProps: { path: string; search?: string; subdomain?: string; params: Params; request?: Request }
}