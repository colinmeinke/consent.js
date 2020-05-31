# Get consent

A simple Javascript API to ask for and store consent.

## Usage

First load consent.

```js
window.consent = {
  ready() {return this._},
  _: new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.setAttribute('src', './consent.js')
    s.setAttribute('defer', '')
    s.addEventListener('load', resolve)
    s.addEventListener('error', reject)
    document.body.appendChild(s)
  }),
}
```

### Basic consent example

```html
<h1>First section</h1>
<h2 id="next-section">Second section</h2>
```

```js
// Wait until consent granted, then go to next section
;(async function() {
  await consent.ready()
  await consent.granted('go-to-next-section')
  document.querySelector('#next-section').scrollIntoView()
}())

// Ask for consent
document.addEventListener('DOMContentLoaded', async () => {
  await consent.ready()

  consent.request('go-to-next-section')

  // Use confirm dialog as consent gate modal
  if (confirm('Can I show you the next section?')) {
    consent.grant('go-to-next-section', {expires: 0})
  } else {
    consent.deny('go-to-next-section', {expires: 0})
  }
})
```

### Third-party script loading example

```js
// Wait until consent granted, then load third-party scripts
;(async function() {
  await consent.ready()
  await consent.granted('load-third-party-scripts')

  const s = document.createElement('script')
  s.setAttribute('defer', '')
  s.setAttribute('src', `https://www.googletagmanager.com/gtag/js?id=${gtmId}`)
  document.body.appendChild(s)
  window.dataLayer = window.dataLayer || []
  function gtag(){dataLayer.push(arguments)}
  gtag('js', new Date())
  gtag('config', gtmId)
}())

// Ask for consent (if not already stated)
;(async function() {
  await consent.ready()

  if (!consent.status('load-third-party-scripts')) {
    // Create HTML consent gate modal
    const el = document.createElement('div')

    el.setAttribute('style', `
      position: absolute;
      top: 10px;
      left: 10px;
      background: #FFF;
      border: 3px solid #000;
    `)

    el.innerHTML = `
      <p>Grant consent for Google Analytics, Ads etc.?</p>

      <button type="button" onclick="consent.deny('load-third-party-scripts')">
        No
      </button>

      <button type="button" onclick="consent.grant('load-third-party-scripts')">
        Yes
      </button>
    `

    consent.request('load-third-party-scripts')

    document.body.appendChild(el)
  }
}())
```