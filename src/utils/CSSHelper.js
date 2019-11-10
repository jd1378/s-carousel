class CSSHelper {
  /**
   *
   * @param {HTMLElement} el
   * @param {String} classname
   */
  hasClass(el, className) {
    if (el.classList) return el.classList.contains(className)
    return !!el.className.includes(className)
  }

  /**
   *
   * @param {HTMLElement} el
   * @param {String} classname
   */
  addClass(el, className) {
    if (el.classList) el.classList.add(className)
    else if (!this.hasClass(el, className)) el.className += ' ' + className
  }

  /**
   *
   * @param {HTMLElement} el
   * @param {String} classname
   */
  removeClass(el, className) {
    if (el.classList) {
      el.classList.remove(className)
    } else if (this.hasClass(el, className)) {
      el.className = el.className
        .split(className)
        .join()
        .trim()
    }
  }
}

export default new CSSHelper()
