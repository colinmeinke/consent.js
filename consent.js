class Consent {
  constructor(apiKey) {
    // @todo Send events to server if API key/hostname match.
  }

  // Given a string or an array return an array.
  _arr(x) {return typeof x === 'string' ? [x] : x}

  // Given an array of IDs and a value of 1 or 0
  // set a consent cookie for each ID.
  _setCookies(ids, v) {
    ids.forEach(id => {document.cookie = `consent-${id}=${v}; path=/`})
  }

  // Emit a custom consent event.
  _emit(name, ids) {
    document.dispatchEvent(new CustomEvent(`consent.${name}`, {
      detail: {ids}
    }))
  }

  // Given an event type and an array of consent IDs
  // wait until a consent event of specifed type for every ID
  // and then resolve the promise.
  _listener(type, ids) {
    // Keep track of consent IDs that have not received an event.
    let awaiting = [...ids]

    return new Promise(resolve => {
      ids.forEach(id => {
        // For each consent ID, listen for a consent event of specified type.
        document.addEventListener(`consent.${type}`, ({detail}) => {
          detail.ids.forEach(eventId => {
            // If consent ID matches one of the event ids.
            if (id === eventId) {
              // Remove the ID from the list of IDs we are awating.
              awaiting = awaiting.filter(i => i !== id)
              // If awaiting list is now empty we're done.
              if (!awaiting.length) resolve() 
            }
          })
        })
      })
    })
  }

  // Return an immediately resolving promise.
  // Used by a consuming script to check if this script is loaded.
  ready() {
    return new Promise(r => r())
  }

  // Given a consent ID check its current status.
  status(id) {
    const cookie = document.cookie
      .split(';')
      .map(c => c.trim().split('='))
      .find(([k]) => k === `consent-${id}`)

    const value = cookie && parseInt(cookie[1], 10)

    switch (value) {
      case 0: return 'denied'
      case 1: return 'granted'
      default: return undefined
    }
  }

  // Emit a consent.request event.
  request(id) {
    const ids = this._arr(id)
    this._emit('request', ids)
  }

  // Emit a consent.deny event
  // and if not a one time action, store consent status in cookies.
  deny(id, {expires} = {}) {
    const ids = this._arr(id)
    this._emit('deny', ids)
    if (expires !== 0) this._setCookies(ids, 0)
  }

  // Emit a consent.grant event
  // and if not a one time action, store consent status in cookies.
  grant(id, {expires} = {}) {
    const ids = this._arr(id)
    this._emit('grant', ids)
    if (expires !== 0) this._setCookies(ids, 1)
  }

  // Wait until each consent ID has received a consent.request event
  // then resolve the returned promise.
  requested(id) {
    const ids = this._arr(id)
    return this._listener('request', ids)
  }

  // Check to see if all consent IDs already have a denied status
  // and if so return an immediately resolving promise.
  // If not wait until each consent ID has received a consent.deny event
  // then resolve the promise.
  denied(id) {
    const ids = this._arr(id)
    const undenied = ids.filter(i => this.status(id) !== 'denied')
    if (!undenied.length) return new Promise(r => r())
    return this._listener('deny', undenied)
  }

  // Check to see if all consent IDs already have a granted status
  // and if so return an immediately resolving promise.
  // If not wait until each consent ID has received a consent.grant event
  // then resolve the promise.
  granted(id) {
    const ids = this._arr(id)
    const ungranted = ids.filter(i => this.status(id) !== 'granted')
    if (!ungranted.length) return new Promise(r => r())
    return this._listener('grant', ungranted)
  }
}

window.consent = new Consent(document.currentScript.dataset.id)