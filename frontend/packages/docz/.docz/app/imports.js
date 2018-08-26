export const imports = {
  'docz/components/button.mdx': () =>
    import(/* webpackPrefetch: true, webpackChunkName: "docz-components-button" */ 'docz/components/button.mdx'),
  'docz/components/draggableModal.mdx': () =>
    import(/* webpackPrefetch: true, webpackChunkName: "docz-components-draggable-modal" */ 'docz/components/draggableModal.mdx'),
  'docz/components/logo.mdx': () =>
    import(/* webpackPrefetch: true, webpackChunkName: "docz-components-logo" */ 'docz/components/logo.mdx'),
  'docz/components/search.mdx': () =>
    import(/* webpackPrefetch: true, webpackChunkName: "docz-components-search" */ 'docz/components/search.mdx'),
  'docz/components/searchBar.mdx': () =>
    import(/* webpackPrefetch: true, webpackChunkName: "docz-components-search-bar" */ 'docz/components/searchBar.mdx'),
}
