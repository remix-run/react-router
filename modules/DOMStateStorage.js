import warning from 'warning'

const QuotaExceededErrors = {
  QuotaExceededError: true,
  QUOTA_EXCEEDED_ERR: true
}

const SecurityErrors = {
  SecurityError: true
}

const KeyPrefix = '@@ReactRouter/'

const createKey = (key) =>
  KeyPrefix + key

const DOMStateStorage = {
  saveState(key, state) {
    if (!window.sessionStorage) {
      // Session storage is not available or hidden.
      // sessionStorage is undefined in Internet Explorer when served via file protocol.
      warning(
        false,
        '[react-router] Unable to save state; sessionStorage is not available'
      )

      return
    }

    try {
      if (state == null) {
        window.sessionStorage.removeItem(createKey(key))
      } else {
        window.sessionStorage.setItem(createKey(key), JSON.stringify(state))
      }
    } catch (error) {
      if (SecurityErrors[error.name]) {
        // Blocking cookies in Chrome/Firefox/Safari throws SecurityError on any
        // attempt to access window.sessionStorage.
        warning(
          false,
          '[react-router] Unable to save state; sessionStorage is not available due to security settings'
        )

        return
      }

      if (QuotaExceededErrors[error.name] && window.sessionStorage.length === 0) {
        // Safari "private mode" throws QuotaExceededError.
        warning(
          false,
          '[react-router] Unable to save state; sessionStorage is not available in Safari private mode'
        )

        return
      }

      throw error
    }
  },

  readState(key) {
    let json
    try {
      json = window.sessionStorage.getItem(createKey(key))
    } catch (error) {
      if (SecurityErrors[error.name]) {
        // Blocking cookies in Chrome/Firefox/Safari throws SecurityError on any
        // attempt to access window.sessionStorage.
        warning(
          false,
          '[react-router] Unable to read state; sessionStorage is not available due to security settings'
        )

        return undefined
      }
    }

    if (json) {
      try {
        return JSON.parse(json)
      } catch (error) {
        // Ignore invalid JSON.
      }
    }

    return undefined
  }
}

export default DOMStateStorage
