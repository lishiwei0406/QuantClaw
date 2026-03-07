import { h } from 'vue'
import Theme from 'vitepress/theme'
import './custom.css'

export default {
  extends: Theme,
  Layout: () => {
    return h(Theme.Layout, null, {
      // slots
    })
  },
  enhanceApp({ app, router, siteData }) {
    // Custom app logic here
  }
}
